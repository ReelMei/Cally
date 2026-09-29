import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../Config/socket.js";
import toast from "react-hot-toast";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export const useWebRTC = (roomId, user, onMeetingEnded, enabled = true) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([]); // Array of { socketId, userId, userName, stream, audioEnabled, videoEnabled }
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
    const localStreamRef = useRef(null);

    // Initialize local media stream
    const initLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (error) {
            toast.error("Could not access camera/microphone");
            console.error("Media devices access error:", error);
            // Fallback: try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = audioStream;
                setLocalStream(audioStream);
                setVideoEnabled(false);
                return audioStream;
            } catch (err) {
                console.error("Audio-only fallback error:", err);
                return null;
            }
        }
    }, []);

    // Create RTCPeerConnection for a target socket
    const createPeerConnection = useCallback((targetSocketId, targetUser) => {
        if (peersRef.current.has(targetSocketId)) {
            return peersRef.current.get(targetSocketId);
        }

        const peer = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                peer.addTrack(track, localStreamRef.current);
            });
        }

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    targetSocketId,
                    senderSocketId: socket.id,
                    candidate: event.candidate,
                });
            }
        };

        // Handle incoming remote stream tracks
       peer.ontrack = (event) => {
    console.log("🎥 REMOTE TRACK RECEIVED:", {
        targetSocketId,
        kind: event.track.kind,
        stream: event.streams[0],
    });

    const remoteStream = event.streams[0];

    setRemoteUsers((prev) => {
        const existingIndex = prev.findIndex(
            (u) => u.socketId === targetSocketId
        );

        if (existingIndex > -1) {
            const updated = [...prev];

            updated[existingIndex] = {
                ...updated[existingIndex],
                stream: remoteStream,
            };

            return updated;
        }

        return [
            ...prev,
            {
                socketId: targetSocketId,
                userId: targetUser?.userId,
                userName: targetUser?.userName || "Participant",
                stream: remoteStream,
                audioEnabled: targetUser?.audioEnabled ?? true,
                videoEnabled: targetUser?.videoEnabled ?? true,
            },
        ];
    });
};

        peer.onconnectionstatechange = () => {
    console.log(
        `🔗 Peer ${targetSocketId} connection state:`,
        peer.connectionState
    );
};

peer.oniceconnectionstatechange = () => {
    console.log(
        `🧊 Peer ${targetSocketId} ICE state:`,
        peer.iceConnectionState
    );
};

        peersRef.current.set(targetSocketId, peer);
        return peer;
    }, []);

    // Main WebRTC & Socket signaling setup effect
useEffect(() => {
    if (!roomId || !user || !enabled) return;

    let isMounted = true;

    const startSession = async () => {
        const stream = await initLocalStream();

        if (!stream || !isMounted) return;

        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        setVideoEnabled(hasVideo);
        setAudioEnabled(hasAudio);

        // ------------------------------------------------
        // SOCKET EVENT LISTENERS
        // Register these BEFORE joining the room.
        // ------------------------------------------------

        socket.on("all-users", async (existingUsers) => {
            console.log("ALL USERS:", existingUsers);

            for (const existingUser of existingUsers) {
                const peer = createPeerConnection(
                    existingUser.socketId,
                    existingUser
                );

                try {
                    const offer = await peer.createOffer();

                    await peer.setLocalDescription(offer);

                    socket.emit("offer", {
                        targetSocketId: existingUser.socketId,
                        callerSocketId: socket.id,
                        sdp: peer.localDescription,
                    });

                } catch (error) {
                    console.error("Error creating offer:", error);
                }
            }
        });

        socket.on("user-joined", (newUser) => {
            console.log("USER JOINED:", newUser);

            toast(`${newUser.userName} joined the meeting`, {
                icon: "👋",
            });

            // We DON'T create the offer here.
            // The newcomer will create the offer.
            createPeerConnection(
                newUser.socketId,
                newUser
            );
        });

        socket.on(
            "offer",
            async ({ callerSocketId, sdp, callerUser }) => {
                console.log("OFFER RECEIVED FROM:", callerSocketId);

                const peer = createPeerConnection(
                    callerSocketId,
                    callerUser
                );

                try {
                    await peer.setRemoteDescription(
                        new RTCSessionDescription(sdp)
                    );

                    const answer = await peer.createAnswer();

                    await peer.setLocalDescription(answer);

                    socket.emit("answer", {
                        targetSocketId: callerSocketId,
                        responderSocketId: socket.id,
                        sdp: peer.localDescription,
                    });

                } catch (error) {
                    console.error(
                        "Error handling offer:",
                        error
                    );
                }
            }
        );

        socket.on(
            "answer",
            async ({ responderSocketId, sdp }) => {
                console.log(
                    "ANSWER RECEIVED FROM:",
                    responderSocketId
                );

                const peer =
                    peersRef.current.get(responderSocketId);

                if (!peer) {
                    console.warn(
                        "No peer found for answer:",
                        responderSocketId
                    );
                    return;
                }

                try {
                    await peer.setRemoteDescription(
                        new RTCSessionDescription(sdp)
                    );

                } catch (error) {
                    console.error(
                        "Error setting remote description:",
                        error
                    );
                }
            }
        );

        socket.on(
            "ice-candidate",
            async ({ senderSocketId, candidate }) => {
                console.log(
                    "ICE CANDIDATE FROM:",
                    senderSocketId
                );

                const peer =
                    peersRef.current.get(senderSocketId);

                if (!peer || !candidate) return;

                try {
                    await peer.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );

                } catch (error) {
                    console.error(
                        "Error adding ICE candidate:",
                        error
                    );
                }
            }
        );

        socket.on(
            "user-toggled-audio",
            ({ socketId, audioEnabled }) => {
                setRemoteUsers((prev) =>
                    prev.map((u) =>
                        u.socketId === socketId
                            ? { ...u, audioEnabled }
                            : u
                    )
                );
            }
        );

        socket.on(
            "user-toggled-video",
            ({ socketId, videoEnabled }) => {
                setRemoteUsers((prev) =>
                    prev.map((u) =>
                        u.socketId === socketId
                            ? { ...u, videoEnabled }
                            : u
                    )
                );
            }
        );

        socket.on(
            "user-left",
            ({ socketId, user: leftUser }) => {
                if (leftUser) {
                    toast(
                        `${leftUser.userName} left the meeting`
                    );
                }

                const peer =
                    peersRef.current.get(socketId);

                if (peer) {
                    peer.close();
                    peersRef.current.delete(socketId);
                }

                setRemoteUsers((prev) =>
                    prev.filter(
                        (u) => u.socketId !== socketId
                    )
                );
            }
        );

        socket.on(
            "meeting-ended",
            ({ message }) => {
                toast.error(
                    message || "This meeting has ended"
                );

                if (onMeetingEnded) {
                    onMeetingEnded(message);
                }
            }
        );

        // ------------------------------------------------
        // CONNECT SOCKET
        // ------------------------------------------------

        if (!socket.connected) {
            socket.connect();
        }

        // ------------------------------------------------
        // JOIN ROOM
        // This MUST happen AFTER listeners are registered.
        // ------------------------------------------------

        socket.emit("join-room", {
            roomId,
            user,
            audioEnabled: hasAudio,
            videoEnabled: hasVideo,
        });
    };

    startSession();

    return () => {
        isMounted = false;

        if (localStreamRef.current) {
            localStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
        }

        peersRef.current.forEach((peer) => {
            peer.close();
        });

        peersRef.current.clear();

        socket.off("all-users");
        socket.off("user-joined");
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
        socket.off("user-toggled-audio");
        socket.off("user-toggled-video");
        socket.off("user-left");
        socket.off("meeting-ended");

        socket.disconnect();
    };

}, [
    roomId,
    user?.id,
    enabled,
    createPeerConnection,
    initLocalStream,
    onMeetingEnded
]);

    // Toggle local mic
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const newState = !audioEnabled;
                audioTrack.enabled = newState;
                setAudioEnabled(newState);
                socket.emit("toggle-audio", { roomId, audioEnabled: newState });
            }
        }
    };

    // Toggle local camera
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                const newState = !videoEnabled;
                videoTrack.enabled = newState;
                setVideoEnabled(newState);
                socket.emit("toggle-video", { roomId, videoEnabled: newState });
            }
        }
    };

    // End meeting for everyone (Host action)
    const endMeeting = useCallback(() => {
        if (roomId) {
            socket.emit("end-meeting", { roomId });
        }
    }, [roomId]);

    return {
        localStream,
        remoteUsers,
        audioEnabled,
        videoEnabled,
        toggleAudio,
        toggleVideo,
        endMeeting,
    };
};

