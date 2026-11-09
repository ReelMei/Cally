import { sql } from "./Config/db.js";

// Socket.IO Room state: roomId -> Map<socketId, participantObject>
const rooms = new Map();

const MAX_MESSAGE_LENGTH = 2000;

const isInRoom = (roomId, socketId) =>
    Boolean(roomId && rooms.get(roomId)?.has(socketId));

export function setupSocketIO(io){
    io.on('connection', (socket) => {
        // Identity comes from the verified Clerk token (see io.use in server.js),
        // never from the client payload.
        const userId = socket.data.userId;

        let currentRoomId = null;
        let currentMeetingDbId = null;
        let currentUser = null;

        // User joins a room
        socket.on('join-room', async ({roomId, user, audioEnabled = true, videoEnabled = true} = {})=> {
            try {
                if (!roomId || typeof roomId !== 'string') {
                    socket.emit('room-error', { message: 'Invalid room id', fatal: true });
                    return;
                }

                if (currentRoomId) {
                    // Already in a room on this socket; ignore duplicate joins
                    return;
                }

                //  Verify Meeting Status from db
                const meetings = await sql `SELECT * FROM meetings WHERE meeting_id = ${roomId}`;

                if (meetings.length === 0) {
                    socket.emit('meeting-ended', {message: 'Meeting not found'})
                    return;
                }
                const meeting = meetings[0];

                if(meeting.status === 'ended'){
                    socket.emit('meeting-ended', { message: 'Session has been concluded'})
                    return;
                }

                const isHost = meeting.host_id.toString() === userId.toString();

                // Prefer the name stored for this user; fall back to client-provided display name
                const dbUsers = await sql `SELECT name FROM users WHERE id = ${userId}`;
                const clientName = typeof user?.name === 'string' ? user.name.trim().slice(0, 255) : '';
                const userName = dbUsers[0]?.name || clientName || 'Anonymous';

                if(!rooms.has(roomId)) {
                    rooms.set(roomId, new Map())
                }

                const roomParticipants = rooms.get(roomId);

                // Fetch host plans to enforce participants limits (5 for free, 20 for premium)
                const hosts = await sql `SELECT plan FROM users WHERE id = ${meeting.host_id}`;

                const hostPlan = hosts[0]?.plan || 'free';
                const maxParticipants = hostPlan === 'premium' ? 20 : 5;

                if(roomParticipants.size >= maxParticipants){
                    socket.emit('room-error', {message : `Session Room capacity limit reached (max ${maxParticipants} participants for ${hostPlan.toUpperCase()} plan). Host should upgrade to premium for more participants!`,
                        fatal: true,
                    })
                    if (roomParticipants.size === 0) rooms.delete(roomId);
                    return;
                }

                currentRoomId = roomId;
                currentMeetingDbId = meeting.id;
                currentUser = {
                    socketId: socket.id,
                    userId,
                    userName,
                    isHost,
                    audioEnabled: Boolean(audioEnabled),
                    videoEnabled: Boolean(videoEnabled),
                }

                socket.join(roomId);

                //Get Existing Participants in the room
                const existingUsers = Array.from(roomParticipants.values());

                //Add new participants to socket state
                roomParticipants.set(socket.id, currentUser);

                // Save participant into DB (one row per user per meeting); clear left_at on rejoin
                const existingParticipants = await sql `
                SELECT id FROM meeting_participants
                WHERE meeting_id = ${meeting.id} AND user_id = ${userId}
                LIMIT 1`;

                if(existingParticipants.length === 0){
                    await sql `
                    INSERT INTO meeting_participants (meeting_id, user_id, name, joined_at)
                    VALUES (${meeting.id}, ${userId}, ${userName}, NOW())`;
                } else {
                    await sql `
                    UPDATE meeting_participants SET left_at = NULL
                    WHERE id = ${existingParticipants[0].id}`;
                }

                // Send list of existing users to the newcomer
                socket.emit('all-users', existingUsers);

                //Notify participants in the room
                socket.to(roomId).emit('user-joined', currentUser)

            } catch (error) {
                console.error('Error joining room in socket:', error);
                socket.emit('meeting-ended', { message: 'Failed to join room.'})
            }
        })

        // WebRTC signalling is only relayed between sockets in the same room.

        // WEBRTC Signaling: Offer
        socket.on('offer', ({targetSocketId, sdp} = {}) => {
            if (!isInRoom(currentRoomId, socket.id) || !isInRoom(currentRoomId, targetSocketId)) return;
            io.to(targetSocketId).emit('offer', {
                callerSocketId: socket.id,
                sdp,
                callerUser: currentUser,
            })
        })

        // WebRTC Signalling: Answer
        socket.on('answer', ({targetSocketId, sdp} = {}) => {
            if (!isInRoom(currentRoomId, socket.id) || !isInRoom(currentRoomId, targetSocketId)) return;
            io.to(targetSocketId).emit('answer', {
                responderSocketId: socket.id,
                sdp,
            })
        })

        // WebRTC Signalling: ICE Candidate
        socket.on('ice-candidate', ({targetSocketId, candidate} = {}) => {
            if (!isInRoom(currentRoomId, socket.id) || !isInRoom(currentRoomId, targetSocketId)) return;
            io.to(targetSocketId).emit('ice-candidate', {
                senderSocketId: socket.id,
                candidate
            })
        })

        // Audio Toggle Event
        socket.on('toggle-audio', ({ audioEnabled } = {}) => {
            if (!isInRoom(currentRoomId, socket.id)) return;
            const enabled = Boolean(audioEnabled);
            rooms.get(currentRoomId).get(socket.id).audioEnabled = enabled;
            socket.to(currentRoomId).emit('user-toggle-audio', {
                socketId: socket.id,
                audioEnabled: enabled,
            })
        })

        // Video Toggle Event
        socket.on('toggle-video', ({ videoEnabled } = {}) => {
            if (!isInRoom(currentRoomId, socket.id)) return;
            const enabled = Boolean(videoEnabled);
            rooms.get(currentRoomId).get(socket.id).videoEnabled = enabled;
            socket.to(currentRoomId).emit('user-toggle-video', {
                socketId: socket.id,
                videoEnabled: enabled,
            })
        })

        // Chat message event -> persist to DB & Broadcast
        socket.on('send-message', async ({ message } = {}) => {
            try {
                if (!isInRoom(currentRoomId, socket.id)) return;

                const text = typeof message?.text === 'string' ? message.text.trim() : '';
                if (!text) return;
                if (text.length > MAX_MESSAGE_LENGTH) {
                    socket.emit('room-error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
                    return;
                }

                const meetings = await sql `SELECT id, status FROM meetings WHERE meeting_id = ${currentRoomId}`;

                if(meetings.length > 0 && meetings[0].status !== 'ended'){
                    await sql`
                    INSERT INTO meeting_messages (meeting_id, sender_id, sender_name, text, timestamp)
                    VALUES (${meetings[0].id}, ${userId}, ${currentUser.userName}, ${text}, NOW())`;

                    io.in(currentRoomId).emit('receive-message', {
                        id: typeof message.id === 'string' ? message.id : Date.now().toString(),
                        text,
                        time: typeof message.time === 'string' ? message.time : '',
                        senderId: userId,
                        senderName: currentUser.userName,
                        senderSocketId: socket.id,
                    })
                }
            } catch (error) {
                console.error('Error saving chat to DB:', error);
            }
        })

        // Host ends meeting for all via End Meeting Button
        socket.on('end-meeting', async () => {
            if (!currentRoomId || !currentUser?.isHost) {
                socket.emit('room-error', {
                    message: 'Only the host can end the meeting'
                });
                return;
            }

            const roomId = currentRoomId;
            try {
                await sql `
                UPDATE meetings
                SET status = 'ended', ended_at = NOW()
                WHERE meeting_id = ${roomId}`;

                await sql `
                UPDATE meeting_participants SET left_at = NOW()
                WHERE meeting_id = ${currentMeetingDbId} AND left_at IS NULL`;

                io.to(roomId).emit('meeting-ended', { message: 'The meeting has been ended by the host'});
                io.in(roomId).socketsLeave(roomId);
                rooms.delete(roomId);
            } catch (error) {
                console.error('Error ending meeting', error);
            }
        })

        // Disconnect (Reloading window, network drop, or closing tab)
        socket.on('disconnect', async () => {
            if (!currentRoomId || !rooms.has(currentRoomId)) return;

            const roomParticipants = rooms.get(currentRoomId);
            roomParticipants.delete(socket.id);

            const userStillInRoom = Array.from(roomParticipants.values()).some((p) => p.userId === userId);

            if (roomParticipants.size === 0){
                rooms.delete(currentRoomId);
            } else {
                // Notify remaining participants that a user left
                socket.to(currentRoomId).emit('user-left', {
                    socketId: socket.id,
                    user: currentUser,
                })
            }

            if (!userStillInRoom && currentMeetingDbId) {
                try {
                    await sql `
                    UPDATE meeting_participants SET left_at = NOW()
                    WHERE meeting_id = ${currentMeetingDbId} AND user_id = ${userId} AND left_at IS NULL`;
                } catch (error) {
                    console.error('Error recording participant leave:', error);
                }
            }
        })
    })
}
