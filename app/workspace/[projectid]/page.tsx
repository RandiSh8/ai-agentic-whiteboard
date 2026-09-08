"use client";
import SmartDoc from "@/components/custom/workspace/SmartDoc";
import Whiteboard from "@/components/custom/workspace/Whiteboard";
import WorkspaceHeader from "@/components/custom/workspace/WorkspaceHeader";
import React, { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteboard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const handleExportImage = async () => {
    if (!api) return;
    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements:api.getSceneElements(),
      appState:{
        ...api.getAppState(),
        exportBackground:true
      },
      files:api.getFiles(),
      mimeType:'image/png',
      quality:1
    })
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.download='whiteboard.png';
    link.href=url;
    link.click();
    URL.revokeObjectURL(url);

  }

  return (
    <div>
      <WorkspaceHeader selectedTab={(value: string) => setActiveTab(value)}
      
      
      onExport={()=>handleExportImage()}  
      />

      {activeTab == "whiteboard" ? 
      <Whiteboard 
      onApiReady={(api)=>{
        setApi(api);
        
      }}
      /> : <SmartDoc/>
      }
    </div>
  );
}

export default Workspace;
