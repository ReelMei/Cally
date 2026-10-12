import { Calendar, MessageSquare, Users } from 'lucide-react'
import React from 'react'

const SessionCard = ({session, onOpenDetails, onRejoin}) => {

    const isEnded = session.status === "ended"

  return (
    <div className='bg-white/70  backdrop-blur rounded-3xl p-6 transition-all flex flex-col justify-between space-y-5 border-slate-100/50 shadow-xs'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
            <span className='text-xs font-mono text-slate-500 font-medium bg-slate-500/5 px-2.5 py-1 rounded-md'>ID: {session.meeting}</span>
            <span className={`tex-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${isEnded ? "bg-red-800 text-white" : "bg-green-500 text-black"}`}>
                <span className={`size-1.5 rounded-full ${isEnded ? "bg-slate-400" : "bg-emerald-600"}`}/>

                {isEnded ? "Ended" : "Active"}

            </span>
        </div>

        <h3 className='text-xl font-medium text-slate-900 truncate'>
            {session.title || "Instant Session"}
        </h3>

        <p className='text-xs text-slate-400 flex items-center gap-1.5'>
            <Calendar className='w-3.5 h-3.5 text-slate-400'/>
            {new Date(session.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })}
        </p>

      </div>


      {/* stats row */}
      <div className='grid grid-cols-2 gap-3 pt-3 border-t border-slate-300/30'>
      <div className='flex items-center gap-2 text-xs bg-slate-500/50 p-2.5 rounded-xl'>
       <Users className='w-4 h-4 text-primary'/>
       <span>
        <strong className='font-semibold text-slate-900'>{session.participants?.length || 0}</strong> Participants
       </span>
      </div>

      <div className='flex items-center gap-2 text-xs bg-slate-500/50 p-2.5 rounded-xl'>
       <MessageSquare className='w-4 h-4 text-primary'/>
       <span>
        <strong className='font-semibold text-slate-900'>{session.messages?.length || 0}</strong> Messages
       </span>
      </div>

      </div>

       {/* Actions */}
       <div className='flex items-center justify-between gap-3 pt-2 text-black'>
        <button onClick={() => onOpenDetails(session.meeting)} className='w-full font-medium bg-slate-400 rounded-full text-center text-xs transition-all py-2.5 px-4  hover:bg-primary cursor-pointer '>
          View Details
        </button>
        {!isEnded && (
          <button onClick={() => onRejoin(session.meeting)} className='text-blue-700 font-bold w-full bg-slate-400/25 hover:bg-black hover:text-white backdrop-blur-2xl py-2.5 px-4 rounded-full shadow-xs text-center '>
            Rejoin
          </button>
        )}
       </div>


    </div>
  )
}

export default SessionCard
