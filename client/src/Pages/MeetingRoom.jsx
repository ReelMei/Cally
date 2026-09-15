import React, { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyMeetingDetails, dummyUser } from '../assets/asset'
import VideoGrid from '../Components/Meeting/VideoGrid'
import useWebRTC from '../Hooks/useWebRTC'
import ChatPanel from '../Components/Meeting/ChatPanel'
import { useChat } from '../Hooks/UseChat'
import ParticipantList from '../Components/Meeting/ParticipantList'
import ControlBar from '../Components/Meeting/ControlBar'

const MeetingRoom = () => {

  const {meetingId} = useParams()
  const navigate = useNavigate()
  const userData = dummyUser;

  const [isParticipantOpen, setIsParticipantOpen] = useState(false)

  const handleMeetingEnded = useCallback(()=> {
    navigate('/dashboard')
  }, [navigate])

  //Initialize WebRTC
  const {localStream, remoteUsers, audioEnabled, videoEnabled, toggleAudio, toggleVideo, endMeeting} = useWebRTC(meetingId, userData, handleMeetingEnded)

  //Initialize Room Chat
  const {messages, sendMessage, unreadCount, isChatOpen, toogleChat} = useChat(meetingId, userData)



  const isHost = true;

  const handleLeave = () => {

  }

  const handleEndMeeting = () => {
    
  }


  return (
    <div className="h-screen w-screen  bg-[url('/mylogin_bg.jpg')] bg-cover text-slate-900 flex flex-col overflow-hidden relative font-sans">
     
     {/*Top Bar */}
     <div className='w-full bg-white/90 backdrop-blur px-6 py-3 border-b border-slate-300 flex items-center justify-between z-30 shadow-x'>
       <div className='flex items-center gap-3'>
         <h2 className='text-black tracking-tight font-bold text-xl'>
          {dummyMeetingDetails.title} ({meetingId || dummyMeetingDetails.meetingId})
         </h2>
         <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse'>
           
         </span>
       </div>
     </div>

      {/*Main (Video Grid + Side Panels) */}
      <div className='flex-1 flex overflow-hidden relative'>
         {/*Video Grid */}
         <VideoGrid 
         localStream={localStream}
         localUser={userData}
         remoteUsers={remoteUsers}
         audioEnabled={audioEnabled}
         videoEnabled={videoEnabled}
         />


          {/* In-Meeting Chat */}
          <ChatPanel 
          isOpen={isChatOpen}
          onClose={toogleChat}
          messages={messages}
          onSendMessage={sendMessage}
          currentUser={userData}
          />


           {/* Participant Drawer */}
           <ParticipantList 
<<<<<<< Updated upstream
           isOpen={isParticipantOpen}
=======
          isOpen={isParticipantOPen}
>>>>>>> Stashed changes
           onClose={() => setIsParticipantOpen(false)}
           localUser={userData}
           localAudio={audioEnabled}
           localVideo={videoEnabled}
           remoteUsers={remoteUsers}
           meetingHostId={dummyUser.id}
           />
<<<<<<< Updated upstream
=======
           
>>>>>>> Stashed changes


            

      </div>
      <ControlBar 
      roomId={meetingId || dummyMeetingDetails.meetingId}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleChat={toogleChat}
            onToggleParticipants={() => setIsParticipantOpen((prev) => !prev)}
            isChatOpen={isChatOPen}
            isParticipantOpen={isParticipantOPen}
            unreadCount={unreadCount}
            participantCount={1 + remoteUsers.length}
            isHost={isHost}
            onLeave={HandleLeave}
            onEndMeeting={HandleEndMeeting}
      />

      {/* Bottom Floating */}
            { <ControlBar 
            roomId={meetingId || dummyMeetingDetails.meetingId}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleChat={toogleChat}
            onToggleParticipants={() => setIsParticipantOpen((prev) => !prev)}
            isChatOpen={isChatOpen}
            isParticipantOpen={isParticipantOpen}
            unreadCount={unreadCount}
            participantCount={1 + remoteUsers.length}
            isHost={isHost}
            onLeave={handleLeave}
            onEndMeeting={handleEndMeeting}
            /> }

    </div>
  )
}

export default MeetingRoom
