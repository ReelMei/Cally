import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EmptySessions from '../Components/Sessions/EmptySessions'
import SessionCard from '../Components/Sessions/SessionCard'
import SessionModalDetails from '../Components/Sessions/SessionModalDetails'
import { useAuth } from '@clerk/react'
import api from '../Config/api.js'
import toast from 'react-hot-toast'
import Loader from '../Components/Loader.jsx'

const Sessions = () => {

  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true);

  const { isLoaded, isSignedIn, getToken} = useAuth();


  useEffect(() => {
    const fetchSessions = async () => {
      if(!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();
        if(!token) return;
        const res = await api.get('/api/meetings/sessions', {headers: {Authorization: `Bearer ${token}`}})
        setSessions(res.data.meetings || [])
      } catch (_error) {
        toast.error('Failed to get meeting sessions')
      }finally{
        setLoading(false)
      }

    }
    fetchSessions();

  }, [isLoaded, isSignedIn, getToken])

  const openSessionDetails = async (sessionId) => {
    try {
      const token = await getToken();
      const res = await api.get(`/api/meetings/sessions/${sessionId}`, {headers: {Authorization: `Bearer ${token}`}});
      setSelectedSession(res.data.meeting);
    } catch (_error) {
      toast.error('Could not fetch the session details')
    }
  }

  if(loading){
    return <Loader text='Hold on a sec.......'/>
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
