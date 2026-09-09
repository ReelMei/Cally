import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './Pages/Login'
import ProtectedLayout from './Components/ProtectedLayout'
import Dashboard from './Pages/Dashboard'
import Sessions from './Pages/Sessions'
import Pricing from './Pages/Pricing'
import MeetingRoom from './Pages/MeetingRoom'
import ProtectedRoute from './Components/ProtectedRoute'


const App = () => {
  return (
    <>
      <Toaster />
      <Routes>

        {/* Private Routes */}

        <Route path='/login' element={<Login mode="login"/>} />
        <Route path='/register' element={<Login mode="register"/>} />

        {/* Public Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path='/dashboard' element={<Dashboard />}/>
            <Route path='/session' element={<Sessions />}/>
            <Route path='/pricing' element={< Pricing />}/>
          </Route>
           <Route path='/meeting/:meetingId' element={< MeetingRoom />}/>
        </Route>


        {/* Other Routes */}

         <Route path='*' element={< Navigate to='/dashboard' replace />}/>

      </Routes>
    </>
  )
}

export default App
