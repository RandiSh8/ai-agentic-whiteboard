"use client";
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Archive, LayoutGrid, Settings, Sparkle, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link";
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs";
import CreateNewBoardDialog from "./CreateNewBoardDialog";
import { useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";

export function AppSidebar() {
    const path=usePathname();
    const {user}=useUser();
    const { userDetail } = useContext(UserDetailContext) || {};
    const totalCredits = 3;
    const credits = userDetail?.credits !== undefined ? userDetail.credits : 3;
    const filesCreated = Math.max(0, Math.min(totalCredits, totalCredits - credits));
    const progressPercent = (filesCreated / totalCredits) * 100;
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Logo" width={40} height={40}/>
        <h2 className="text-xl font-bold">WhizBoard</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
           <CreateNewBoardDialog/>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>My Boards</SidebarGroupLabel>
            <Link href="/dashboard" className="block">
              <SidebarMenuButton className="p-5 w-full cursor-pointer" isActive={path=="/dashboard"}>
                  <LayoutGrid/>
                  <span>All Files</span>
              </SidebarMenuButton>
            </Link>
            <SidebarMenuButton className="p-5 mt-2" isActive={path=="/shared-files"}>
                <Users/>
                <span>Shared</span>
            </SidebarMenuButton>
            <Link href="/dashboard/archived" className="block">
              <SidebarMenuButton className="p-5 mt-2 w-full cursor-pointer" isActive={path=="/archived" || path=="/dashboard/archived"}>
                  <Archive/>
                  <span>Archived</span>
              </SidebarMenuButton>
            </Link>

        </SidebarGroup>
        < SidebarGroup>
          <SidebarGroupLabel>Others</SidebarGroupLabel>
           <SidebarMenuButton className="p-5 mt-2" isActive={path=="/ai"}>
                <Sparkle/>
                <span>AI Helper
                </span>
            </SidebarMenuButton>
             <SidebarMenuButton className="p-5 mt-2" isActive={path=="/settings"}>
                <Settings/>
                <span>Settings</span>
            </SidebarMenuButton>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <CreateNewBoardDialog/>
        <div className="p-4 my-3 border rounded-md">
            <h2 className="text-sm flex justify-between mb-1">
              {filesCreated} {filesCreated === 1 ? 'file' : 'files'} created 
              <span>total {totalCredits}</span>
            </h2>
            <Progress value={progressPercent} className="h-2 mt-2"/>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-md">
            {user?.imageUrl && (
                <Image src={user.imageUrl} alt="User Image" width={40} height={40} className="rounded-full"/>

            )}
            <h2>{user?.firstName} {user?.lastName}</h2>
        </div>
        </SidebarFooter>
    </Sidebar>
  )
}