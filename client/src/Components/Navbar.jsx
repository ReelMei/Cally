import React from 'react'
import { dummyUser } from '../assets/asset'
import { Link, useLocation } from 'react-router-dom'
import { Astroid, CircleUser, History, LayoutDashboard, User } from 'lucide-react'
import { UserButton } from '@clerk/react'

const Navbar = () => {

  const {isSignedIn, user} = {user: dummyUser, isSignedIn: true}
  const location = useLocation()
  const userName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || "user";

  return (
    <div>
     <div className='w-full max-w-305 mx-auto bg-white/90 backdrop-blur xl:rounded-b-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between border border-slate-200'>

     {/* Logo and Nav LInks */}
     <div className='flex items-center gap-6'>
      <Link to='/dashboard' className='flex items-center gap-1.5'>
       <img src="/logo.svg" alt="cally logo" className='size-6.5 ' />

        <span className='text-2xl font-bold tracking-tight text-slate-800 flex items-center'>Cally</span>
      </Link>

      {isSignedIn && (
        <nav className='hidden md:flex items-center gap-1.5 ml-2'>
          <Link to='/dashboard' 
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            location.pathname === '/dashboard' ? "ring ring-blue-200 text-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}>

            <LayoutDashboard className='w-3.5 h-3.5'/> Dashboard

          </Link>

          <Link to='/session' 
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            location.pathname === '/session' ? "ring ring-blue-200 text-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}>

            <History className='w-3.5 h-3.5'/> Sessions

          </Link>


          <Link to='/pricing' 
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            location.pathname === '/pricing' ? "ring ring-blue-200 text-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}>

            <Astroid className='w-3.5 h-3.5'/> Pricing

          </Link>

        </nav>
      )}
     

     </div>


     {/* Profile/ UserButton */}
     {isSignedIn && (
        <div className='flex items-center gap-4'>
          <Link to='/session' className='md-hidden text-xs font-medium text-slate-600 hover:text-primary flex items-center gap-1 '>
            <History className='w-4 h-4'/>
              Sessions
          </Link>
          <span className='font-medium hidden sm:inline tracking-wide text-sm text-slate-700'>Welcome, {userName}</span>

         <UserButton afterSignOutUrl='/login'/>

        </div>
     )

     }

     </div>
    </div>
  )
}

export default Navbar
