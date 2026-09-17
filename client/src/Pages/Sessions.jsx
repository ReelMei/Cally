import { ArrowLeft } from 'lucide-react'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dummySessions } from '../assets/asset'
import EmptySessions from '../Components/Sessions/EmptySessions'
import SessionCard from '../Components/Sessions/SessionCard'
import SessionModalDetails from '../Components/Sessions/SessionModalDetails'

const Sessions = () => {

  const [sessions] = useState(dummySessions)
  const [selectedSession, setSelectedSession] = useState(null)
  const navigate = useNavigate()

  const openSessionDetails = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId || s.meetingId === sessionId)

    if(session){
      setSelectedSession(session);
    }
  }

  return (
    <div className='flex-1 max-w-7xl w-full mx-auto p-6 md:p-12'>
      {/*Header */}
      <Link to='/dashboard' className='flex items-center text-sm gap-1 mb-4 text-slate-500 hover:text-slate-900 transition-colors'>
      <ArrowLeft  size={25}/> Back Home
      </Link>

      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-black'>Room Sessions</h1>
        <p className='mt-1 text-slate-700 font-medium'>View and Review past and current sessions history, participant infos and chat transcript.</p>
      </div>

       {/*Session Container */}
       {
        sessions.length === 0 ? (
          <EmptySessions />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
           {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onOpenDetails={openSessionDetails} onRejoin={(meetingId) => navigate(`/meeting/${meetingId}`) }/>
           ))}
          </div>
        )
       }

        {/*Session Detail Modal */}
       <SessionModalDetails session={selectedSession} onClose={()=> setSelectedSession(null)}/>





    
    </div>
  )
}

export default Sessions
