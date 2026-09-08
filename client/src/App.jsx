import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Routes } from 'react-router-dom'
import Login from './Pages/Login'


const App = () => {
  return (
    <>
      <Toaster />
      <Routes>

        {/* Private Routes */}

        <Route path='/login' element={<Login mode="login"/>} />
        <Route path='/register' element={<Login mode="register"/>} />

        {/* Public Routes */}




        {/* Other Routes */}
      </Routes>
    </>
  )
}

export default App
