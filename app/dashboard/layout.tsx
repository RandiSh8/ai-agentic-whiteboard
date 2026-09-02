import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { AppSidebar } from "@/components/custom/dashboard/AppSideBar";
import AppHeader from "@/components/custom/AppHeader";

function DashboardLayout({children}:{children:React.ReactNode}){
    return(
        <SidebarProvider>
    <AppSidebar/>
    <div className="flex flex-col flex-1">
      <AppHeader/>
        {children}
    </div>
    </SidebarProvider>
    )
}

export default DashboardLayout;