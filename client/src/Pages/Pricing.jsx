import React from 'react'
import { PricingTable } from '@clerk/react'

const Pricing = () => {
  return (
    <div className='max-w-4xl w-full mx-auto min-h-[calc(100vh-7rem)] flex flex-col gap-5 items-center justify-center p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-black'>Upgrade Your Plan</h1>
        <p className='text-sm text-slate-900 mt-1'>Choose the Plan that's right for you and unlock all the features of Cally.</p>
      </div>

      <PricingTable /> 

    </div>
  )
}

export default Pricing
