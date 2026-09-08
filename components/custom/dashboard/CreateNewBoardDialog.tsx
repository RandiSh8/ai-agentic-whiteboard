"use client"
import React, { useState, useContext } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { UserDetailContext } from '@/context/UserDetailContext'

interface CreateNewBoardDialogProps {
  children?: React.ReactElement;
}

function CreateNewBoardDialog({ children }: CreateNewBoardDialogProps) {
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};

  const handleCreateBoard = async () => {
    if (workspaceName.trim() === "" || workspaceName.length > 30) {
      toast.add({
        type: "error",
        title: "Invalid Workspace Name",
        description: "Please enter a valid workspace name"
      })
      return;
    }

    if (userDetail?.credits !== undefined && userDetail.credits <= 0) {
      toast.add({
        type: "error",
        title: "Credit Limit Reached",
        description: "You have used all 3 free boards. Delete or archive an existing board to create a new one."
      });
      return;
    }

    setLoading(true)
    try {
      const projectId = crypto.randomUUID()
      const result = await axios.post('/api/projects', {
        projectName: workspaceName,
        projectId: projectId
      })
      console.log(result?.data);

      if (setUserDetail && userDetail) {
        setUserDetail({
          ...userDetail,
          credits: Math.max(0, (userDetail.credits ?? 3) - 1)
        });
      }

      toast.add({
        type: "success",
        title: "New Workspace Created"
      })
      // Close dialog first, then navigate after it fully unmounts
      setOpen(false);
      setWorkspaceName('');
      setTimeout(() => {
        router.push('/workspace/' + projectId)
      }, 150)
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error;
      if (msg === 'Insufficient Credits') {
        toast.add({
          type: "error",
          title: "Insufficient Credits",
          description: "You can only create up to 3 boards. Please delete a board to create a new one."
        });
      } else {
        toast.add({
          type: "error",
          title: "Failed to create board",
          description: "Something went wrong. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setWorkspaceName('');
    }}>
      <DialogTrigger
        className={children ? "w-auto" : "w-full"}
        render={children ?? <Button className="w-full"><Plus />Create New Board</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Whiteboard Workspace Name</DialogTitle>
        </DialogHeader>
        <div>
          <label className='text-gray-500'>Enter Whiteboard Workspace Name</label>
          <Input
            placeholder='Workspace Name'
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && workspaceName.trim().length > 0) {
                handleCreateBoard()
              }
            }}
            className='mt-1'
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={workspaceName?.length === 0 || loading} onClick={handleCreateBoard}>
            {loading && <Loader2 className="animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateNewBoardDialog