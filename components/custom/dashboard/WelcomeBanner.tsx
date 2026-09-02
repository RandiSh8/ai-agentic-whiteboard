"use client"
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs'
import { Sparkles } from 'lucide-react';
import React from 'react'
import CreateNewBoardDialog from "./CreateNewBoardDialog";

function WelcomeBanner() {
    const {user}=useUser();
  return (
    <div className='relative border rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-100 p-8'>
      {/* Left content */}
      <div className='max-w-lg'>
        {/* Label */}
        <div className='flex items-center gap-1 text-purple-600 text-sm font-medium mb-3'>
          <Sparkles className='w-4 h-4'/>
          <span>Your creative workspace</span>
        </div>

        {/* Heading */}
        <h2 className='text-2xl font-bold mb-1'>
          Welcome back, <span className='text-purple-600'>{user?.firstName}</span> 👋
        </h2>

        {/* Subtitle */}
        <p className='text-muted-foreground text-sm mb-5'>
          Turn your ideas into diagrams, notes and visuals on an infinite canvas.
        </p>

        {/* Buttons */}
        <div className='flex items-center gap-3'>
          <CreateNewBoardDialog>
            <Button size='lg'>+ Create New Board</Button>
          </CreateNewBoardDialog>
          <Button variant='outline' size='lg'><Sparkles className='w-4 h-4 mr-1'/>Ask AI</Button>
        </div>
      </div>

      {/* Right decorative card */}
      <div className='absolute right-8 top-1/2 -translate-y-1/2 hidden md:block'>
        <div className='bg-white rounded-2xl shadow-lg p-5 w-fit border border-gray-100'>
          {/* macOS window dots */}
          <div className='flex gap-1.5 mb-4'>
            <span className='w-3 h-3 rounded-full bg-red-400'/>
            <span className='w-3 h-3 rounded-full bg-yellow-400'/>
            <span className='w-3 h-3 rounded-full bg-green-400'/>
          </div>
          {/* Two pill buttons */}
          <div className='flex gap-2 mb-3'>
            <div className='flex items-center gap-2 bg-yellow-100 text-yellow-800 font-semibold px-3 py-2 rounded-full text-sm whitespace-nowrap'>
              💡 New Idea
            </div>
            <div className='flex items-center gap-2 bg-purple-100 text-purple-700 font-semibold px-3 py-2 rounded-full text-sm whitespace-nowrap'>
              ✦ AI Brainstorm
            </div>
          </div>
          {/* Design → Build → Ship */}
          <div className='bg-slate-100 text-slate-500 font-medium text-sm text-center py-2 rounded-full'>
            Design → Build → Ship
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeBanner
