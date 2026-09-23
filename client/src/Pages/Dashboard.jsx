import { ArrowRight, Keyboard, Plus, ShieldCheck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyStats, dummyUser } from '../assets/asset'
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/react';

const Dashboard = () => {

  const {user} = useUser();
  const userName = user.fullName;
  const userEmail = user.primaryEmailAddress.emailAddress
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const stats = dummyStats

   const [joinId, setJoinId] = useState("")


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return ()=> clearInterval(timer)
  }, [])

    const handleCreateMeeting = () => {
      setIsCreating(true)
      const chars = "abdcefghijklmnopqrestuvwxyz1234567890"
      const seg = () => Array.from({length: 3}, ()=> chars[Math.floor(Math.random() * chars.length)]).join("");
      const newMeetingId = `${seg()}-${seg()}-${seg()}`;

      setTimeout(() => {
        setIsCreating(false)
        toast.success("Room Created!")
        navigate(`/meeting/${newMeetingId}`)
      }, 1000)
    }

     const handleJoinMeeting = (e) => {
      e.preventDefault();
      const cleanId = joinId.trim();

      if (!/^[a-z]{3}(?:-[a-z]{3}){2}$/.test(cleanId)){
        toast.error("Enter a Valid Room ID");
        return;
      }

      navigate(`/meeting/${encodeURIComponent(cleanId)}`)
    }


  return (
    <div className='flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center'>
       <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center'>
          {/* Left */}
          <div className='lg:leading col-span-7 space-y-8 w-full'>

            <div className='spacey-3'>
               <div className='inline-flex gap-2 px-3.5 pr-6 py-2 rounded-full bg-white/10 text-xs font-medium'>
                <ShieldCheck size={16}/> <span className='text-black'>Secure Peer-To-Peer Encryption</span>
                
               </div>
               <h1 className='text-4xl sm:text-5xl text-slate-800 leading-tight font-bold pt-3'>
                High Quality Video Calls. <br />
                 <span className='text-primary'>Built With you in mind.</span>
               </h1>
               <p className='text-slate-900 text-base sm:text-lg max-w-xl  leading-relaxed'>
                Connect, Collab and Yap from anywhere, anytime with ultra-low latency video, screen sharing and real time chat
               </p>

               <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2'>
                <button 
                onClick={handleCreateMeeting}
                disabled = {isCreating}
                className='bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3.5 rounded-full shadow-md shadow-primary/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50'>
                  <Plus className='w-5 h-5'/>
                  <span>{isCreating ? "Hold Up, Creating" : "New Meeting"}</span>
                </button>

                <form onSubmit={handleJoinMeeting} className='flex-1 flex items-center gap-2'>
                   <div className='flex-1 relative'>
                     <Keyboard className='w-5  h-5 text-primary/90 absolute left-4 top-1/2 -translate-y-1/2'/>

                     <input type="text" placeholder='Enter Unique Room Code (e.g. abc-def-ghi)' value={joinId} onChange={(e)=>setJoinId(e.target.value)} className='w-full bg-white/75 border border-primary-border/80 focus:border-primary/60 focus:ring-1 focus:ring-primary/60 rounded-full pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all'/>
                   </div>

                   <button 
                   className='bg-blue-500 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-red-500 text-white font-medium px-6 py-3.5 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs'
                   disabled={!joinId.trim()}
                   type='submit'>
                      <span>Join</span>
                      <ArrowRight className='w-4 h-4 ml-1.5'/>
                   </button>


                </form>

               </div>
            </div>

          </div>


           {/* Right */}
           <div className='lg:col-span-5 flex flex-col items-center justify-center space-y-4'>

            <div className='w-full bg-white/25 backdrop-blur rounded-4xl p-8 border border-slate-200 text-center space-y-6 relative overflow-hidden'>
               <div className='space-y-1'>
                  <p className='mb-5 text-xl text-left text-black'>Cheers, <span className='font-medium text-blue-800'>{userName}!</span></p>

                  <h2 className='text-3xl xl:text-7xl my-4 text-black tracking-wide'>
                    {currentTime.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                  </h2>

                  <p className='font-medium text-primary tracking-wider'>
                     {currentTime.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                     })}
                  </p>

               </div>

               <div className='pt-4 border-t border-white/30 text-sm text-slate-600'>
                  <div className='flex items-center justify-between py-6 px-4'>
                    <p>Logged in as: <span>{userEmail}</span></p>
                    <span className={`px-4 py-1 rounded-full font-semibold text-xs uppercase ${stats?.plan === "premium" ? "bg-blue-700 text-white" : "text-slate-800"}`}>
                      {stats?.plan || "Free"}
                    </span>

                  </div>

                  {stats && (
                    <div className='w-full bg-white/50 rounded-2xl px-5 py-4 border border-slate-100'>
                      <div className='flex items-center justify-between text-sm'>
                        <span>Monthly Meetings</span>
                        <span className='text-xs text-slate-600 font-mono'>
                          {stats.monthlyLimit ? `${stats.monthlyCount} / ${stats.monthlyLimit} used` : `${stats.monthlyCount} Created(Unlimited)`}
                        </span>
                      </div>
                    </div>
                  )}

               </div>

            </div>
           </div>
       </div>
    </div>
  )
}

export default Dashboard
