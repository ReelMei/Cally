import { X } from 'lucide-react';
import React, { useState } from 'react'
import SessionChatTab from './SessionChatTab';
import SessionParticipantTab from './SessionParticipantTab';

const SessionModalDetails = ({session, onClose}) => {

    const [activeTab, setActiveTab] = useState("chat");

    if(!session) return null;

    const isEnded = session.status === "ended";

  return (
    <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4'>
      <div className='bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200'>

        {/* Header */}
        <div className='p-6 border-b border-slate-100 flex items-center justify-between'>
            <div>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-mono text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md'>ID: {session.meetingId}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isEnded ? "bg-red-500 text-white " : "bg-emerald-500 text-emerald-800"
                    }`}>
                        {isEnded ? "Ended" : "Active"}
                    </span>
                </div>
                <h2>{session.title || "Meeting Details"}</h2>
                <p className='text-xs text-slate-400 mt-1'>
                    Host: {session.host?.name || "Host"} • Created{new Date(session.createdAt).toLocaleString()}
                </p>
            </div>
            <button onClick={onClose} className='p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer' aria-label='close session detail'>
                <X  className='w-5 h-5'/>
            </button>

        </div>

        {/* Title */}
        <div className='flex border-b border-slate-600 px-6 bg-slate-50/50'>
        <button className={`py-3 px-4 font-medium text-sm border-b cursor-pointer transition-all ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`} onClick={() => setActiveTab("chat")}>
            Chat Record ({session.messages?.length || 0})
        </button>

        <button className={`py-3 px-4 font-medium text-sm border-b-2 cursor-pointer transition-all ${activeTab === "participants" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`} onClick={() => setActiveTab("participants")}>
            Participant Log ({session.participants?.length || 0})
        </button>

        </div>


        {/* content */}
        <div className='flex-1 p-6 overflow-y-auto min-h-75'>
            {activeTab === 'chat' ? (
               <SessionChatTab messages={session.messages}/>
            ) : (
                <SessionParticipantTab participants={session.participants} host={session.host}/>
            )}
        </div>


      </div>
    </div>
  )
}

export default SessionModalDetails
