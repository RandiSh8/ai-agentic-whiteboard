"use client";
import SmartDoc from "@/components/custom/workspace/SmartDoc";
import Whiteboard from "@/components/custom/workspace/Whiteboard";
import WorkspaceHeader from "@/components/custom/workspace/WorkspaceHeader";
import React, { useEffect, useState, useRef, useCallback } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { generatePreviewBase64, normalizeAppState } from "@/utils/helper";
import axios from "axios";
import { useParams } from 'next/navigation';
import { toast } from "@/components/ui/toast";

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteboard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [boardData, setBoardData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const isSceneLoadedRef = useRef(false);

  const params = useParams();
  // Folder is [projectid] (lowercase), so useParams gives { projectid: '...' }
  const projectId = (params?.projectid || params?.projectId) as string;

  const handleApiReady = useCallback((newApi: ExcalidrawImperativeAPI) => {
    setApi(newApi);
  }, []);

  useEffect(() => {
    if (projectId) {
      isSceneLoadedRef.current = false;
      GetWhiteboardData();
    }
  }, [projectId]);

  useEffect(() => {
    if (boardData && api && !isSceneLoadedRef.current) {
      isSceneLoadedRef.current = true;
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

  const handleSaveCanvas = async () => {
    if (!api || !projectId) return;
    setSaving(true);
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      const previewBase64 = await generatePreviewBase64(api);

      const updatedAppState = {
        ...appState,
        ...(previewBase64 ? { image: previewBase64 } : {}),
      };

      const result = await axios.post("/api/whiteboard", {
        projectId,
        elements,
        appState: updatedAppState,
        files,
        image: previewBase64,
      });

      if (result.status === 200) {
        toast.add({ title: "Canvas Saved", type: "success" });
      }
    } catch (err: any) {
      console.error("Failed to save whiteboard:", err);
      toast.add({ title: "Failed to save whiteboard", type: "error" });
    } finally {
      setSaving(false);
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
        onSave={handleSaveCanvas}
        saving={saving}
      />

      {activeTab == "whiteboard" ? (
        <Whiteboard onApiReady={handleApiReady} />
      ) : (
        <SmartDoc />
      )}
    </div>
  );
}

export default Workspace;
