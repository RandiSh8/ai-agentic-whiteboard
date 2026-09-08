"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import axios from "axios";
import { useParams } from "next/navigation";
import { toast } from "@/components/ui/toast";
import "./whiteboard.css";
import {
  ArrowRight,
  Circle,
  Diamond,
  Eraser,
  Hand,
  Icon,
  Image,
  MousePointer2,
  Minus,
  Pencil,
  Square,
  Type,
  Sparkles,
} from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

import FloatingProperties from "./FloatingProperties";
import { Button } from "@/components/ui/button";
import AIFloatingSidebar from "./AIFloatingSidebar";

const tools = [
  {
    name: "selection",
    icon: MousePointer2,
    color: "text-blue-600",
  },
  {
    name: "hand",
    icon: Hand,
    color: "text-cyan-600",
  },
  {
    name: "rectangle",
    icon: Square,
    color: "text-blue-600",
  },
  {
    name: "diamond",
    icon: Diamond,
    color: "text-emerald-500",
  },
  {
    name: "ellipse",
    icon: Circle,
    color: "text-amber-500",
  },
  {
    name: "arrow",
    icon: ArrowRight,
    color: "text-violet-500",
  },
  {
    name: "line",
    icon: Minus,
    color: "text-pink-500",
  },
  {
    name: "freedraw",
    icon: Pencil,
    color: "text-orange-500",
  },
  {
    name: "text",
    icon: Type,
    color: "text-indigo-500",
  },
  {
    name: "image",
    icon: Image,
    color: "text-green-500",
  },
  {
    name: "eraser",
    icon: Eraser,
    color: "text-rose-500",
  },
];
type Props={
  onApiReady:(api:ExcalidrawImperativeAPI)=>void
}

function Whiteboard({onApiReady}:Props) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimeRef = useRef<any>(null);
  const params = useParams();
  const projectId = (params?.projectid || params?.projectId) as string;
  const [activeTool, setActiveTool] = useState("selection");
  const [selectedElement,setSelectedElement]=useState<any>(null);
  const [canvasState,setCanvasState]=useState<any>(null);
  const[ShowAiSidebar,setShowAiSidebar]=useState(false);

  const handleCanvasChange = (
    elements: readonly any[],
    appState: any,
    files: any,
  ) => {
    // Detect selected element
    const selectedIds = Object.keys(appState.selectedElementIds || {});
    if (selectedIds.length === 1) {
      const element = elements.find((el) => el.id === selectedIds[0]);
      console.log(element);
      setSelectedElement(element ?? null);
    } else {
      setSelectedElement(null);
    }

    setCanvasState(appState);

    // Cancel previous timer
    if (saveTimeRef?.current) {
      clearTimeout(saveTimeRef?.current);
    }

    // Debounce save by 2 seconds after user stops drawing/editing
    saveTimeRef.current = setTimeout(async () => {
      await SaveCanvasChanges(elements, appState, files);
    }, 2000);
  };

  const SaveCanvasChanges = async (
    elements: readonly any[],
    appState: any,
    files: any,
  ) => {
    if (!projectId) return;
    try {
      const result = await axios.post("/api/whiteboard", {
        elements: elements,
        appState: appState,
        files: files,
        projectId: projectId,
      });

      if (result.status === 200 && result.data) {
        toast.add({ title: "Canvas Saved", type: "success" });
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const api = excalidrawAPIRef.current;
        if (!api) return;
        const appState = api.getAppState();
        const elements = api.getSceneElements();
        const selectedIds = Object.keys(appState.selectedElementIds || {});
        if (selectedIds.length === 1) {
          const element = elements.find((el) => el.id === selectedIds[0]);
          setSelectedElement(element ?? null);
        } else {
          setSelectedElement(null);
        }
      }, 50);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);  // empty deps — always reads fresh API from ref

  const changeTool = (tool: any) => {
    if (!excalidrawAPI) return;

    setActiveTool(tool);
    excalidrawAPI.setActiveTool({
      type: tool,
    });
  };
  const getFloatingPosition = () => {
    if (!selectedElement || !canvasState) {
      return { left: 0, top: 0 };
    }
    const zoom = canvasState.zoom?.value ?? 1;
    const scrollX = canvasState.scrollX ?? 0;
    const scrollY = canvasState.scrollY ?? 0;
    // center of selected element
    const centerX = selectedElement.x + selectedElement.width / 2;
    // screen coordinates
    const screenX = (centerX + scrollX) * zoom;
    const centerY = selectedElement.y + selectedElement.height / 2;
    const screenY = (centerY + scrollY) * zoom;

    return {
      left: screenX,
      top: screenY - 60,
    };
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const updatedElements = elements.map((el) => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          [property]: value,
        };
      }
      return el;
    });
    excalidrawAPI.updateScene({ elements: updatedElements });
    setSelectedElement((prev: any) => (prev ? { ...prev, [property]: value } : null));
  };

  const handleDelete = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const updatedElements = elements.filter((el) => el.id !== selectedElement.id);
    excalidrawAPI.updateScene({ elements: updatedElements });
    setSelectedElement(null);
  };

  const handleDuplicate = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const newElement: any = {
      ...selectedElement,
      id: `${selectedElement.id}_copy_${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };

    // If linear element (arrow/line), deep clone points and clear bindings to prevent non-normalized state
    if (Array.isArray(selectedElement.points)) {
      newElement.points = selectedElement.points.map((p: any) => [...p]);
      delete newElement.startBinding;
      delete newElement.endBinding;
    }
    delete newElement.boundElements;

    excalidrawAPI.updateScene({ elements: [...elements, newElement] });
  };

  const handleLock = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const isLocked = !selectedElement.isLocked;
    handlePropertyChange("isLocked", isLocked);
  };

  const handleBringToFront = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const target = elements.find((el) => el.id === selectedElement.id);
    if (!target) return;
    const rest = elements.filter((el) => el.id !== selectedElement.id);
    excalidrawAPI.updateScene({ elements: [...rest, target] });
  };

  const handleSendToBack = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const target = elements.find((el) => el.id === selectedElement.id);
    if (!target) return;
    const rest = elements.filter((el) => el.id !== selectedElement.id);
    excalidrawAPI.updateScene({ elements: [target, ...rest] });
  };

  const floatingPosition = getFloatingPosition();

  return (
    <div className="relative" style={{ height: "90vh" }}>
      <Excalidraw
        //@ts-ignore
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          excalidrawAPIRef.current = api;
          setExcalidrawAPI(api);onApiReady(api)
        }}
        onChange={handleCanvasChange}
      />
      <FloatingProperties
        selectedElement={selectedElement}
        position={floatingPosition}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onLock={handleLock}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onPropertyChange={handlePropertyChange}
      />
      <div className="absolute left-4 top-20 z-50 flex flex-col gap-1 rounded-2xl bg-white border p-1.5 shadow-xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.name}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-primary/10 hover:cursor-pointer ${activeTool == tool.name ? "bg-primary/10" : ""}`}
              onClick={() => changeTool(tool.name)}
            >
              <Icon size="19" className={tool.color} />
            </button>
          );
        })}
      </div>
      <div className="absolute right-15  bottom-2 z-50">
        <Button size={"lg"} onClick={()=>setShowAiSidebar(!ShowAiSidebar)}>
          <Sparkles/>AI
        </Button>
      </div>
      {ShowAiSidebar && <AIFloatingSidebar onClose={() => setShowAiSidebar(false)} excalidrawAPI={excalidrawAPI}/>}
    </div>
  );
}

export default Whiteboard;
