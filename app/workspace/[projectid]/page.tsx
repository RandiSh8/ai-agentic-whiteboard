"use client";
import SmartDoc from "@/components/custom/workspace/SmartDoc";
import Whiteboard from "@/components/custom/workspace/Whiteboard";
import WorkspaceHeader from "@/components/custom/workspace/WorkspaceHeader";
import React, { useEffect, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { normalizeAppState } from "@/utils/helper";
import axios from "axios";
import { useParams } from 'next/navigation';

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteboard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [boardData, setBoardData] = useState<any>(null);

  const params = useParams();
  // Folder is [projectid] (lowercase), so useParams gives { projectid: '...' }
  const projectId = (params?.projectid || params?.projectId) as string;

  useEffect(() => {
    if (projectId) {
      GetWhiteboardData();
    }
  }, [projectId]);

  useEffect(() => {
    if (boardData && api) {
      api.updateScene({
        elements: boardData.elements || [],
        appState: normalizeAppState(boardData.appState),
      });
      if (boardData.files) {
        api.addFiles(Object.values(boardData.files));
      }
    }
  }, [boardData, api]);

  const GetWhiteboardData = async () => {
    if (!projectId) return;
    try {
      const result = await axios.get('/api/projects?projectId=' + projectId);
      console.log(result.data);
      if (result.data) {
        setProjectName(result.data.projectName || result.data.appState?.name || "");
        setBoardData(result.data);
      }
    } catch (err) {
      console.warn("Could not load whiteboard data:", err);
    }
  };

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
      <WorkspaceHeader 
        projectName={projectName}
        selectedTab={(value: string) => setActiveTab(value)}
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
