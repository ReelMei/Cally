import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyMeetingDetails, dummyUser } from '../assets/asset'
import VideoGrid from '../Components/Meeting/VideoGrid'
import {useWebRTC} from '../Hooks/useWebRTC'
import ChatPanel from '../Components/Meeting/ChatPanel'
import { useChat } from '../Hooks/UseChat'
import ParticipantList from '../Components/Meeting/ParticipantList'
import ControlBar from '../Components/Meeting/ControlBar'
import toast from 'react-hot-toast'
import { useAuth, useUser } from '@clerk/react'
import api from '../Config/api'
import Loader from '../Components/Loader'

const MeetingRoom = () => {

  const {meetingId} = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()

  
  const userData = useMemo(() => {
    if(!user) return null;
    return {
      id: user.id,
      name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user', 
      email: user.primaryEmailAddress?.emailAddress || '',
      image: user.imageUrl || ''
    }
  }, [user?.id, user?.fullName, user?.firstName, user?.primaryEmailAddress?.emailAddress, user?.imageUrl])


  const [meeting, setMeeting] = useState(null)
  const [loadingMeeting, setLoadingMeeting] = useState(true)
  const [isParticipantOpen, setIsParticipantOpen] = useState(false)

  //Fetch Meeting details to verify Validity before enabling webRTC camera access.
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const token = await getToken();
        const res = await api.get(`/api/meetings/${meetingId}`, {
          headers: {Authorization: `Bearer ${token}`}
        })

        if(res.data.meeting.status === 'ended'){
          toast.error('This Room Session is Ended');
          navigate('/dashboard');
          return;
        }
        setMeeting(res.data.meeting)

      } catch (error) {
        const errorMsg = error.response?.data?.error || 'Meeting not found';
        toast.error(errorMsg);
        navigate('/dashbaord')
      }finally {
        setLoadingMeeting(false)
      }
    }
    fetchMeeting();
  }, [meetingId, navigate])



  const handleMeetingEnded = useCallback(()=> {
    navigate('/dashboard')
  }, [navigate])

  //Initialize WebRTC
  const {localStream, remoteUsers, audioEnabled, videoEnabled, toggleAudio, toggleVideo, endMeeting} = useWebRTC(meetingId, userData, handleMeetingEnded)

  //Initialize Room Chat
  const {messages, sendMessage, unreadCount, isChatOpen, toogleChat} = useChat(meetingId, userData)



  const hostId = meeting?.host?.id || meeting?.host;
  const isHost = Boolean(userData?.id || hostId && hostId.toString() === userData.id.toString())


  const handleLeave = () => {
    toast("You've Sucessfully left the room/");
    navigate('/dashboard')
  }

  const handleEndMeeting = () => {
    endMeeting();
    toast("Room Session Ended, Cheers!")
    navigate("/dashboard")
  }

  if(loadingMeeting){
    return <Loader text='Joining meeting room'/>
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
          isOpen={isParticipantOpen}
           onClose={() => setIsParticipantOpen(false)}
           localUser={userData}
           localAudio={audioEnabled}
           localVideo={videoEnabled}
           remoteUsers={remoteUsers}
           meetingHostId={dummyUser.id}
           />
           


            

      </div>
     
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
