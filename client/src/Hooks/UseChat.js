import { useCallback, useEffect, useRef, useState } from "react"
import { socket } from "../Config/socket";


export const useChat = (roomId, user) => {
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false)

  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen])

  useEffect(() => {
    if(!roomId) return;
    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message] );
      if(!isChatOpenRef.current){
        setUnreadCount((prev) => prev + 1);
      }
    }

    socket.on('receive-message', handleReceiveMessage)

    return () => {
      socket.off('receive-message', handleReceiveMessage)
    }

  }, [roomId])

  const sendMessage = useCallback(
    (text) => {
      if(!text.trim() || !user) return;

      const message = {
        id: Date.now().toString(),
        text: text.trim(),
        senderName: user.name || user.fullName || "Me",
        senderId: user.id,
        time: new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
      }

      socket.emit('send-message', {roomId, message})
    },
    [roomId, user?.id, user?.name]
  );

  const toogleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if(!prev) setUnreadCount(0);
      return !prev
    } )
  }, [])

  return {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toogleChat
  }

}
