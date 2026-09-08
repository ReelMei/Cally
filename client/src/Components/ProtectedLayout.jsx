import React from 'react'
import { Outlet } from 'react-router-dom'

const ProtectedLayout = () => {
  return (
    <div className='h-screen overflow-y-scroll bg-slate-50 text-slate-500 '>
      <Outlet />
    </div>
  )
}

export default ProtectedLayout
