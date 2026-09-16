import { ArrowRight } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const EmptySessions = () => {
  return (
    <div className='w-full bg-white/50 backdrop-blur rounded-3xl p-12 xl:py-24 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4'>
      <h3 className='text-xl lg:text-2xl font-medium text-slate-900 '>No Session History yet..</h3>
      <p className='text-sm text-slate-700 max-w-md'>Start Cally today, so your room sessions, participants list and chat logs will appear here... </p>
      <Link to='/dashboard' className='bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-full text-sm transition-all inline-flex items-center gap-2 mt-2'>
       Host a Session now
       <ArrowRight className='w-4 h-4'/>
      </Link>
    </div>
  )
}

export default EmptySessions
