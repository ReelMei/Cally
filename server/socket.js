import { sql } from "./Config/db.js";

// Socket.IO Room state: roomId -> Map<socketId, participantObject>

const rooms = new Map();

export function setupSocketIO(io){
    io.on('connection', (socket) => {
        let currentRoomId = null;
        let currentUser = null;

        // User joins a room
        socket.on('join-room', async ({roomId, user, audioEnabled = true, videoEnabled = true})=> {
            try {
                //  Verify Meeting Status from db

                const meetings = await sql `SELECT * FROM meetings WHERE meeting_id = ${roomId}`;

                if (meetings.length === 0) {
                    socket.emit('meeting-ended', {message: 'Meeting not found'})
                    return;
                }
                const meeting = meetings[0];

                if(meeting.status === 'ended'){
                    socket.emit('room-error', { message: 'Session has been concluded'})
                    return;
                }

                currentRoomId = roomId;
                const isHost = meeting.host_id && user?.id && meeting.host_id.toString() === user.id.toString();
                
                
                currentUser = {
                    socketId: socket.id,
                    userId: user?.id,
                    userName: user?.name || 'Annonymous',
                    isHost,
                    audioEnabled,
                    videoEnabled,

                }

                if(!rooms.has(roomId)) {
                    rooms.set(roomId, new Map())
                }

                const roomParticipants = rooms.get(roomId);

                // Fetch host plans to enforce participants limits (5 for free, 20 for premium)
                const hosts = await sql `SELECT plan FROM users WHERE id = ${meeting.host_id}`;

                const hostPlan = hosts[0]?.plan || 'free';
                const maxParticipants = hostPlan === 'premium' ? 20 : 5;


                if(roomParticipants.size >= maxParticipants){
                    socket.emit('room-error', {message : `Session Room capacity limit reached ( max ${maxParticipants} participants for ${hostPlan.toUpperCase()} plan). Host Should Upgarde to premium for more participants!`
                })
                return;
                }

                socket.join(roomId);

                //Get Existing Participants in the room 
                const existingUsers = Array.from(roomParticipants.values());


                //Add new participants to socket state
                roomParticipants.set(socket.id, currentUser);

                //Save Particpants into DB if not existed
                const userId = user?.id || null;
                const existingParticipants = await sql `
                SELECT id FROM meeting_participants
                WHERE meeting_id = ${meeting.id}
                AND ((${userId}::text IS NOT NULL AND user_id = ${userId}) OR name = ${currentUser.userName})`;

                if(existingParticipants.length === 0){
                    await sql `
                    INSERT INTO meeting_participants (meeting_id, user_id, name, joined_at)
                    VALUES (${meeting.id}, ${userId}, ${currentUser.userName}, NOW())`;
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

        // WEBRTC Signaling: Error
        // send the information needed to start the connection
        socket.on('offer', ({targetSocketId, callerSocketId, sdp}) => {
            io.to(targetSocketId).emit('offer', {
                callerSocketId,
                sdp,
                callerUser: currentUser,

            })
        })

        // WebRTC Signalling: Answer
        // accept the offer request and process connection

        socket.on('answer', ({targetSocketId, responderSocketId, sdp}) => {
            io.to(targetSocketId).emit('answer', {
                responderSocketId,
                sdp,
            })
        })

        // WebRTC Signalling: ICE Candidate
        // Passes the connection details from one user to the other so WebRTC can figure out how to connect them directly

        socket.on('ice-candidate', ({targetSocketId, senderSocketId, candidate}) => {
           io.to(targetSocketId).emit('ice-candidate', {
            senderSocketId,
            candidate
           })
        })


        // Audio Toggle Event
        socket.on('toggle-audio', ({ roomId, audioEnabled}) => {
          if(rooms.has(roomId) && rooms.get(roomId).has(socket.id)){
            rooms.get(roomId).get(socket.id).audioEnabled = audioEnabled
          }
          socket.to(roomId).emit('user-toggle-audio', {
            socketId: socket.id,
            audioEnabled,
          })
        })


           // Video Toggle Event
        socket.on('toggle-video', ({ roomId, videoEnabled}) => {
          if(rooms.has(roomId) && rooms.get(roomId).has(socket.id)){
            rooms.get(roomId).get(socket.id).videoEnabled = videoEnabled
          }
          socket.to(roomId).emit('user-toggle-video', {
            socketId: socket.id,
            videoEnabled,
          })
        })


        // Chat message event -> persist to DB & Broadcast
        socket.on('send-message', async ({roomId, message}) => {
            try {
                const meetings = await sql `SELECT id, status FROM meetings WHERE meeting_id = ${roomId}`;

                if(meetings.length > 0 && meetings[0].status != 'ended'){
                    const meetingId = meetings[0].id;
                    const senderId = message.senderId || null;

                    await sql`
                    INSERT INTO meeting_messages (meeting_id, sender_id, sender_name, text, timestamp)
                    VALUES (${meetingId}, ${senderId}, ${message.senderName || 'Anonymous'}, ${message.text}, NOW())`;

                    io.in(roomId).emit('receive-message', {
                        ...message,
                        senderSocketId: socket.id,
                    })
                }
            } catch (error) {
                console.error('Error saving chat to DB:', error);
            }
        } )


        // Host ends meeting for all via End Meeting Button
        socket.on('end-meeting', async ({ roomId}) => {
          try {
            await sql `
            UPDATE meetings
            SET status = 'ended', ended_at = NOW()
            WHERE meeting_id = ${roomId}`;

            io.to(roomId).emit('meeting-ended', { message: 'The meeting has been ended by the host'});
            rooms.delete(roomId);
          } catch (error) {
            console.error('Error ending meeting', error);
          }
        })


         // Host disonnect (Reloading window, network drop, or closing tab)
        socket.on('disconnect', () => {
          if (currentRoomId && rooms.has(currentRoomId)){
            const roomParticipants = rooms.get(currentRoomId);
            roomParticipants.delete(socket.id);

            if (roomParticipants.size === 0){
                rooms.delete(currentRoomId);
            } else {
                // Notify remaining particpants that a user left
                socket.to(currentRoomId).emit('user-left', {
                    socketId: socket.id,
                    user: currentUser,
                })
            }
          }
        })
        





    })
}