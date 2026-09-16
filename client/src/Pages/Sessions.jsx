import { ArrowLeft } from 'lucide-react'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dummySessions } from '../assets/asset'
import EmptySessions from '../Components/Sessions/EmptySessions'

const Sessions = () => {

  const [sessions] = useState(dummySessions)
  const [selectedSession, setSelectedSession] = useState(null)
  const navigate = useNavigate()

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
          <div>
            <p>Session Card</p>
          </div>
        )
       }

        {/*Session Detail Modal */}
        <p>Session Detail Modal</p>





    
    </div>
  )
}

export default Sessions
