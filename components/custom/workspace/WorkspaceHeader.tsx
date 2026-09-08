'use client'
import Image from 'next/image'
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { DownloadIcon, Save, Share } from 'lucide-react'


type Props={
  projectName?: string;
  selectedTab: any;
  onExport?: () => void;
}

function WorkspaceHeader({ projectName, selectedTab, onExport }: Props) {
  return (
    <div className='p-3 border-b flex justify-between items-center'>
        <div className='flex gap-2 items-center'>
        <Image src={'/logo.svg'} alt='logo' width={35} height={35}/>
        <h2 className='font-semibold text-base md:text-lg text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md'>
          {projectName || "Workspace Name"}
        </h2>
        </div>
        {/* Switch */}
        <div>
            <Tabs defaultValue="whiteboard" className=""
            onValueChange={(value)=>selectedTab?.(value)}
            >
  <TabsList>
    <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
    <TabsTrigger value="doc">Doc</TabsTrigger>
  </TabsList>
    </Tabs>

        </div>
        {/* Extra Button */}
        <div className='flex gap-2'>
          <Button><Save/>Save</Button>
          <Button variant={'outline'}><Share/>Share</Button>
          <Button onClick={onExport}><DownloadIcon/>Export</Button>
        </div>
    </div>
  )
}

export default WorkspaceHeader