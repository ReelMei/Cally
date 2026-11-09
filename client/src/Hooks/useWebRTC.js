import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { socket } from "../Config/socket.js";
import api from "../Config/api.js";
import toast from "react-hot-toast";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const SOCKET_EVENTS = [
    "all-users",
    "user-joined",
    "offer",
    "answer",
    "ice-candidate",
    "user-toggle-audio",
    "user-toggle-video",
    "user-left",
    "meeting-ended",
    "room-error",
    "connect_error",
];

// Ask for camera + mic, falling back to audio only. Returns a MediaStream or null.
const getMediaStream = async () => {
    try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
        toast.error("Could not access camera/microphone");
        console.error("Media devices access error:", error);
        try {
            return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("Audio-only fallback error:", err);
            return null;
        }
    }
};

export const useWebRTC = (roomId, user, onMeetingEnded, enabled = true) => {
    const { getToken } = useAuth();

    const [localStream, setLocalStream] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([]); // Array of { socketId, userId, userName, stream, audioEnabled, videoEnabled }
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
    const pendingCandidatesRef = useRef(new Map()); // socketId -> RTCIceCandidateInit[] received before remote description
    const localStreamRef = useRef(null);
    const iceServersRef = useRef(STUN_SERVERS);

    // Keep latest values in refs so the main effect doesn't re-run when they change identity
    const getTokenRef = useRef(getToken);
    const onMeetingEndedRef = useRef(onMeetingEnded);
    useEffect(() => {
        getTokenRef.current = getToken;
        onMeetingEndedRef.current = onMeetingEnded;
    }, [getToken, onMeetingEnded]);

    // Load short-lived Coturn credentials; fall back to STUN only if unavailable
    const loadIceServers = useCallback(async (token) => {
        try {
            const response = await api.get("/api/turn/credentials", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const turnIceServers = response.data?.iceServers;

            if (!Array.isArray(turnIceServers) || turnIceServers.length === 0) {
                throw new Error("TURN credentials response did not include ICE servers");
            }
            return [...STUN_SERVERS, ...turnIceServers];
        } catch (error) {
            console.error("Could not load TURN credentials, using STUN only:", error);
            toast("Relay server unavailable — connections on some networks may fail.", { icon: "⚠️" });
            return STUN_SERVERS;
        }
    }, []);

    // Apply ICE candidates that arrived before the remote description was set
    const flushPendingCandidates = useCallback(async (socketId, peer) => {
        const pending = pendingCandidatesRef.current.get(socketId);
        if (!pending) return;
        pendingCandidatesRef.current.delete(socketId);
        for (const candidate of pending) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding queued ICE candidate:", error);
            }
        }
    }, []);

    // Create RTCPeerConnection for a target socket
    const createPeerConnection = useCallback((targetSocketId, targetUser) => {
        if (peersRef.current.has(targetSocketId)) {
            return peersRef.current.get(targetSocketId);
        }

        const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });

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
                    candidate: event.candidate,
                });
            }
        };

        // Handle incoming remote stream tracks
        peer.ontrack = (event) => {
            const remoteStream = event.streams[0];

            setRemoteUsers((prev) => {
                const existingIndex = prev.findIndex((u) => u.socketId === targetSocketId);

                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], stream: remoteStream };
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
            if (peer.connectionState === "failed") {
                console.warn(`Peer ${targetSocketId} connection failed`);
            }
        };

        peersRef.current.set(targetSocketId, peer);
        return peer;
    }, []);

    // Main WebRTC & Socket signaling setup effect
    useEffect(() => {
        if (!roomId || !user || !enabled) return;

        let isMounted = true;

        const leave = (message) => {
            onMeetingEndedRef.current?.(message);
        };

        const startSession = async () => {
            const token = await getTokenRef.current();
            if (!isMounted) return;
            if (!token) {
                toast.error("Your session expired, please sign in again.");
                leave();
                return;
            }

            const iceServers = await loadIceServers(token);
            if (!isMounted) return;
            iceServersRef.current = iceServers;

            const stream = await getMediaStream();
            if (!isMounted) {
                stream?.getTracks().forEach((track) => track.stop());
                return;
            }
            if (!stream) {
                toast.error("A microphone is required to join the meeting.");
                leave();
                return;
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            const hasVideo = stream.getVideoTracks().length > 0;
            const hasAudio = stream.getAudioTracks().length > 0;

            setVideoEnabled(hasVideo);
            setAudioEnabled(hasAudio);

            // ------------------------------------------------
            // SOCKET EVENT LISTENERS
            // Register these BEFORE joining the room.
            // ------------------------------------------------

            // Newcomer creates offers to everyone already in the room
            socket.on("all-users", async (existingUsers) => {
                for (const existingUser of existingUsers) {
                    const peer = createPeerConnection(existingUser.socketId, existingUser);

                    try {
                        const offer = await peer.createOffer();
                        await peer.setLocalDescription(offer);

                        socket.emit("offer", {
                            targetSocketId: existingUser.socketId,
                            sdp: peer.localDescription,
                        });
                    } catch (error) {
                        console.error("Error creating offer:", error);
                    }
                }
            });

            socket.on("user-joined", (newUser) => {
                toast(`${newUser.userName} joined the meeting`, { icon: "👋" });

                // The newcomer will send the offer; just prepare the connection.
                createPeerConnection(newUser.socketId, newUser);
            });

            socket.on("offer", async ({ callerSocketId, sdp, callerUser }) => {
                const peer = createPeerConnection(callerSocketId, callerUser);

                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                    await flushPendingCandidates(callerSocketId, peer);

                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);

                    socket.emit("answer", {
                        targetSocketId: callerSocketId,
                        sdp: peer.localDescription,
                    });
                } catch (error) {
                    console.error("Error handling offer:", error);
                }
            });

            socket.on("answer", async ({ responderSocketId, sdp }) => {
                const peer = peersRef.current.get(responderSocketId);

                if (!peer) {
                    console.warn("No peer found for answer:", responderSocketId);
                    return;
                }

                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                    await flushPendingCandidates(responderSocketId, peer);
                } catch (error) {
                    console.error("Error setting remote description:", error);
                }
            });

            socket.on("ice-candidate", async ({ senderSocketId, candidate }) => {
                if (!candidate) return;

                const peer = peersRef.current.get(senderSocketId);

                // Candidate arrived before the offer/answer was applied: queue it
                if (!peer || !peer.remoteDescription) {
                    const queue = pendingCandidatesRef.current.get(senderSocketId) || [];
                    queue.push(candidate);
                    pendingCandidatesRef.current.set(senderSocketId, queue);
                    return;
                }

                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error("Error adding ICE candidate:", error);
                }
            });

            socket.on("user-toggle-audio", ({ socketId, audioEnabled }) => {
                setRemoteUsers((prev) =>
                    prev.map((u) => (u.socketId === socketId ? { ...u, audioEnabled } : u))
                );
            });

            socket.on("user-toggle-video", ({ socketId, videoEnabled }) => {
                setRemoteUsers((prev) =>
                    prev.map((u) => (u.socketId === socketId ? { ...u, videoEnabled } : u))
                );
            });

            socket.on("user-left", ({ socketId, user: leftUser }) => {
                if (leftUser) {
                    toast(`${leftUser.userName} left the meeting`);
                }

                const peer = peersRef.current.get(socketId);
                if (peer) {
                    peer.close();
                    peersRef.current.delete(socketId);
                }
                pendingCandidatesRef.current.delete(socketId);

                setRemoteUsers((prev) => prev.filter((u) => u.socketId !== socketId));
            });

            socket.on("meeting-ended", ({ message }) => {
                toast.error(message || "This meeting has ended");
                leave(message);
            });

            socket.on("room-error", ({ message, fatal }) => {
                toast.error(message || "Something went wrong in the room");
                if (fatal) leave(message);
            });

            socket.on("connect_error", (error) => {
                console.error("Socket connection error:", error.message);
                toast.error("Could not connect to the meeting server.");
                leave(error.message);
            });

            // ------------------------------------------------
            // CONNECT SOCKET (authenticated with the Clerk token)
            // ------------------------------------------------

            socket.auth = { token };

            if (!socket.connected) {
                socket.connect();
            }

            // ------------------------------------------------
            // JOIN ROOM
            // This MUST happen AFTER listeners are registered.
            // ------------------------------------------------

            socket.emit("join-room", {
                roomId,
                user: { name: user.name },
                audioEnabled: hasAudio,
                videoEnabled: hasVideo,
            });
        };

        startSession();

        return () => {
            isMounted = false;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }

            peersRef.current.forEach((peer) => peer.close());
            peersRef.current.clear();
            pendingCandidatesRef.current.clear();
            iceServersRef.current = STUN_SERVERS;

            SOCKET_EVENTS.forEach((event) => socket.off(event));

            socket.disconnect();
            setRemoteUsers([]);
        };
    }, [roomId, user?.id, enabled, createPeerConnection, loadIceServers, flushPendingCandidates]);

    // Toggle local mic
    const toggleAudio = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            const newState = !audioEnabled;
            audioTrack.enabled = newState;
            setAudioEnabled(newState);
            socket.emit("toggle-audio", { roomId, audioEnabled: newState });
        }
    };

    // Toggle local camera
    const toggleVideo = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            const newState = !videoEnabled;
            videoTrack.enabled = newState;
            setVideoEnabled(newState);
            socket.emit("toggle-video", { roomId, videoEnabled: newState });
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
