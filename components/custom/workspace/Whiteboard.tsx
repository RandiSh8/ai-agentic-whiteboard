"use client";
import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import "@excalidraw/excalidraw/index.css";
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const saveTimeRef = useRef<any>(null);
  const params = useParams();
  const projectId = (params?.projectid || params?.projectId) as string;

  const handleCanvasChange = (elements: readonly any[], appState: any, files: any) => {
    // Cancel previous timer
    if (saveTimeRef?.current) {
      clearTimeout(saveTimeRef?.current);
    }

    // Debounce save by 2 seconds after user stops drawing/editing
    saveTimeRef.current = setTimeout(async () => {
      await SaveCanvasChanges(elements, appState, files);
    }, 2000);
  };

  const SaveCanvasChanges = async (elements: readonly any[], appState: any, files: any) => {
    if (!projectId) return;
    try {
      const result = await axios.post('/api/whiteboard', {
        elements: elements,
        appState: appState,
        files: files,
        projectId: projectId
      });

      if (result.status === 200 && result.data) {
        toast.add({ title: "Canvas Saved", type: "success" });
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
    }
  };

  return (
    <div style={{ height: "90vh" }}>
      <Excalidraw
        //@ts-ignore
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleCanvasChange}
      />
    </div>
  );
}

export default Whiteboard;