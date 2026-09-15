import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, MessageSquare, Mic, MicOff, Phone, PhoneOff, Users, Video, VideoOff } from 'lucide-react'

const ControlBar = ({roomId, audioEnabled, videoEnabled, onToggleAudio, onToggleVideo, onToggleChat, onToggleParticipants,  isParticipantOpen, unreadCount, participantCount, isHost, onLeave, onEndMeeting, isChatOpen }) => {

    const [copied, setCopied] = useState(false)

    const copyMeetingId = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast.success("Room Link Sucessfully Copied")
        setTimeout(() => setCopied(false), 2000)
    }

  return (
    <div className='w-full bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-4 flex items-center justify-between z-40 shadow-l shadow-slate-200/50'>
      {/* Left */}
      <div className='hidden sm:flex items-center gap-2'>
        <span className='text-xs font-medium text-slate-600 font-mono'>
          Id: {roomId}
        </span>
        <button onClick={copyMeetingId} className='p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 text-xs font-medium cursor-copy transition-all'>
          {copied ? <Check className='w-3.5 h-3.5 text-emerald-600'/> : <Copy className='w-3.5 h-3.5'/>}
        </button>
        <span>
          {copied ? "Cheers" : "Copy Link"}
        </span>
      </div>

       {/* Center */}
       <div className='flex items-center gap-3 mx-auto sm:mx-0'>

        {/* Audio Toggle */}
        <button onClick={onToggleAudio} className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${audioEnabled ? "bg-slate-300 text-slate-800 hover:bg-slate-200 border-slate-300 shadow-xs" : "bg-red-500 hover:bg-rose-500 text-red-800 border-rose-200 shadow-xs"}`} title={audioEnabled ? "Mute Mic" : "Unmute Mic"}>
          {audioEnabled ? <Mic className='w-5 h-5 '/> : <MicOff className='w-5 h-5'/>}
        </button>

        {/* Video Toggle */}

        <button onClick={onToggleVideo} className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${videoEnabled ? "bg-slate-300 text-slate-800 hover:bg-slate-200 border-slate-300 shadow-xs" : "bg-red-500 hover:bg-rose-500 text-red-800 border-rose-200 shadow-xs"}`} title={videoEnabled ? "Camera ON" : "Camera Off"}>
          {videoEnabled ? <Video className='w-5 h-5 '/> : <VideoOff className='w-5 h-5'/>}
        </button>

        {/* Chat Toggle */}
      
        <button onClick={onToggleChat} className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${isChatOpen ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-800 shadow-xs"}`} title="Open Room Chat">
          <MessageSquare className='w-5 h-5'/>
          {unreadCount > 0 && !isChatOpen && (
            <span className='absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs'>
              {unreadCount}
            </span>
          )}
        </button>



        {/* Participant Toggle */}

        <button onClick={onToggleParticipants} className={`relative p-3.5 rounded-2xl transition-all cursor-pointer border ${isParticipantOpen ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-800 shadow-xs"}`} title="Open Participants List">
          <Users className='w-5 h-5'/>
        
            <span className='absolute -top-1 -right-1 bg-slate-200 text-slate-800  text-[10px] font-bold px-1.5 py-0.5 rounded-full items-center justify-center border-2 border-slate-300'>
              {participantCount}
            </span>
        </button>



        {/* EndCall Toggle */}

        {isHost ? (
          <button 
          onClick={onEndMeeting} 
          className='p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500 transition-all cursor-pointer border border-red-500 ml-2 font-medium text-xs flex items-center gap-2'
          title='End Session All'>
             <Phone className='w-5 h-5'/>
              <span className='hidden md:inline'>Exit Room</span>
          </button>
        ) : (
          <button 
          onClick={onLeave} 
          className='p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500 transition-all cursor-pointer border border-red-500 ml-2 font-medium text-xs flex items-center gap-1.4'
          title='Leave Room'>
            <PhoneOff className='w-5 h-5'/>
            
          </button>
        )}


       </div>


        {/* Right */}

        <div className='hidden sm:block w-32 text-right'>
          <span className='font-medium text-slate-400'>Session Room</span>
        </div>
    </div>
  )
}

export default ControlBar
