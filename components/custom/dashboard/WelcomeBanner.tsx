"use client"
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs'
import {  Sparkles } from 'lucide-react';
import React from 'react'

function WelcomeBanner() {
    const {user}=useUser();
  return (
    <div>
        <div className='p-10  border rounded-xl bg-gradient-to-r from-blue-200 to-purple-200'>
        <h2 className='text-2xl font-bold'>Welcome Back, {user?.fullName}</h2>
        <p>Bring Your Ideas to Life on Infinite Canvas </p>

        <div className='mt-5 items-center gap-2 flex'>
            <Button size='lg'>+ Create New Board</Button>
            <Button variant='outline' size='lg'><Sparkles/>AI Helper</Button>
        </div>
        </div>
    </div>
  )
}

export default WelcomeBanner