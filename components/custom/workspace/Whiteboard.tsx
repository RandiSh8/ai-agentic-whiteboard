"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  HelpCircle,
  Icon,
  Image,
  MousePointer2,
  Minus,
  Pencil,
  Square,
  Type,
  Sparkles,
  X,
} from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

import FloatingProperties from "./FloatingProperties";
import { Button } from "@/components/ui/button";
import AIFloatingSidebar from "./AIFloatingSidebar";
import BottomToolbar from "./BottomToolbar";

const tools = [
  {
    name: "selection",
    icon: MousePointer2,
    color: "text-blue-500",
  },
  {
    name: "hand",
    icon: Hand,
    color: "text-amber-500",
  },
  {
    name: "rectangle",
    icon: Square,
    color: "text-purple-500",
  },
  {
    name: "diamond",
    icon: Diamond,
    color: "text-emerald-500",
  },
  {
    name: "ellipse",
    icon: Circle,
    color: "text-rose-500",
  },
  {
    name: "arrow",
    icon: ArrowRight,
    color: "text-indigo-500",
  },
  {
    name: "line",
    icon: Minus,
    color: "text-cyan-500",
  },
  {
    name: "freedraw",
    icon: Pencil,
    color: "text-orange-500",
  },
  {
    name: "text",
    icon: Type,
    color: "text-teal-500",
  },
  {
    name: "image",
    icon: Image,
    color: "text-green-500",
  },
  {
    name: "eraser",
    icon: Eraser,
    color: "text-red-500",
  },
];
type Props = {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
};

function Whiteboard({ onApiReady }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimeRef = useRef<any>(null);
  const params = useParams();
  const projectId = (params?.projectid || params?.projectId) as string;
  const [activeTool, setActiveTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState<any>(null);
  // groupId of the currently selected group (null = single element or no selection)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [ShowAiSidebar, setShowAiSidebar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleExcalidrawRef = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      if (api) {
        excalidrawAPIRef.current = api;
        setExcalidrawAPI((prev) => (prev === api ? prev : api));
        onApiReady?.(api);
      }
    },
    [onApiReady],
  );

  /** Resolve up to 1 representative element from the current selection.
   *  For grouped elements, returns a synthetic bounding-box element and
   *  stores the shared groupId so handlers can affect the whole group. */
  const resolveSelection = (elements: readonly any[], selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setSelectedElement((prev: any) => (prev === null ? prev : null));
      setSelectedGroupId((prev) => (prev === null ? prev : null));
      return;
    }
    let nextElement: any = null;
    let nextGroupId: string | null = null;

    if (selectedIds.length === 1) {
      const el = elements.find((e) => e.id === selectedIds[0]);
      const gid = el?.groupIds?.[0];
      if (gid) {
        const groupEls = elements.filter((e) => (e.groupIds ?? []).includes(gid));
        if (groupEls.length > 1) {
          const xs = groupEls.map((e) => e.x);
          const ys = groupEls.map((e) => e.y);
          const x2s = groupEls.map((e) => e.x + (e.width ?? 0));
          const y2s = groupEls.map((e) => e.y + (e.height ?? 0));
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...x2s);
          const maxY = Math.max(...y2s);
          nextElement = {
            ...groupEls[0],
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            _isGroupProxy: true,
          };
          nextGroupId = gid;
        } else {
          nextElement = el ?? null;
          nextGroupId = gid;
        }
      } else {
        nextElement = el ?? null;
        nextGroupId = null;
      }
    } else {
      // Multiple selected — check if they all share a groupId
      const selectedEls = selectedIds
        .map((id) => elements.find((e) => e.id === id))
        .filter(Boolean);
      const firstGroupIds: string[] = selectedEls[0]?.groupIds ?? [];
      const sharedGroupId = firstGroupIds.find((gid: string) =>
        selectedEls.every((el) => (el?.groupIds ?? []).includes(gid)),
      );
      if (sharedGroupId) {
        // Build a synthetic bounding-box element for toolbar positioning
        const xs = selectedEls.map((el) => el.x);
        const ys = selectedEls.map((el) => el.y);
        const x2s = selectedEls.map((el) => el.x + (el.width ?? 0));
        const y2s = selectedEls.map((el) => el.y + (el.height ?? 0));
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...x2s);
        const maxY = Math.max(...y2s);
        nextElement = {
          ...selectedEls[0],
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          _isGroupProxy: true,
        };
        nextGroupId = sharedGroupId;
      }
    }

    setSelectedElement((prev: any) => {
      if (!prev && !nextElement) return null;
      if (
        prev &&
        nextElement &&
        prev.id === nextElement.id &&
        prev.x === nextElement.x &&
        prev.y === nextElement.y &&
        prev.width === nextElement.width &&
        prev.height === nextElement.height &&
        prev.strokeColor === nextElement.strokeColor &&
        prev.backgroundColor === nextElement.backgroundColor &&
        prev.isLocked === nextElement.isLocked
      ) {
        return prev;
      }
      return nextElement;
    });

    setSelectedGroupId((prev) => (prev === nextGroupId ? prev : nextGroupId));
  };

  const formatTaskCardText = (rawText: string): string => {
    if (!rawText || rawText.trim() === "") return "☐ ";
    const lines = rawText.split("\n");
    const formattedLines = lines.map((line, idx) => {
      const trimmed = line.trimStart();
      if (
        trimmed.startsWith("☐") ||
        trimmed.startsWith("☑") ||
        trimmed.startsWith("✓") ||
        trimmed.startsWith("[ ]") ||
        trimmed.startsWith("[x]") ||
        trimmed.startsWith("•")
      ) {
        return line;
      }
      if (idx === lines.length - 1 && line === "") {
        return "☐ ";
      }
      return `☐ ${line}`;
    });
    return formattedLines.join("\n");
  };

  const handleCanvasChange = (
    elements: readonly any[],
    appState: any,
    files: any,
  ) => {
    // Cascading deletion check: ensure deleting any part of a note (paper, accent, bound text) deletes all parts of the note
    const deletedIds = new Set<string>();
    elements.forEach((el) => {
      if (el.isDeleted) {
        deletedIds.add(el.id);
      }
    });

    if (deletedIds.size > 0) {
      let expanded = true;
      while (expanded) {
        const prevSize = deletedIds.size;
        elements.forEach((el) => {
          if (deletedIds.has(el.id)) return;

          const hasDeletedGroup = (el.groupIds ?? []).some((gid: string) =>
            elements.some((other) => deletedIds.has(other.id) && (other.groupIds ?? []).includes(gid))
          );

          const isBoundToDeletedContainer = (el as any).containerId && deletedIds.has((el as any).containerId);

          const isContainerOfDeletedText =
            Array.isArray(el.boundElements) &&
            el.boundElements.some((b: any) => deletedIds.has(b.id));

          if (hasDeletedGroup || isBoundToDeletedContainer || isContainerOfDeletedText) {
            deletedIds.add(el.id);
          }
        });
        expanded = deletedIds.size > prevSize;
      }

      let needsUpdate = false;
      const updatedElements = elements.map((el) => {
        if (deletedIds.has(el.id) && !el.isDeleted) {
          needsUpdate = true;
          return {
            ...el,
            isDeleted: true,
            version: (el.version ?? 1) + 1,
            versionNonce: Math.floor(Math.random() * 2000000000),
            updated: Date.now(),
          };
        }
        return el;
      });

      const api = excalidrawAPIRef.current || excalidrawAPI;
      if (needsUpdate && api) {
        setTimeout(() => {
          api.updateScene({ elements: updatedElements });
        }, 0);
        return;
      }
    }

    // Detect selected element (handles both single and grouped selections)
    const selectedIds = Object.keys(appState.selectedElementIds || {});
    resolveSelection(elements, selectedIds);

    // Auto-format Task Card text while editing (adds ☐ checkbox bullet to new lines automatically)
    const editingText = appState?.editingTextElement || appState?.editingElement;
    if (editingText && editingText.type === "text") {
      const editEl = editingText as any;
      const isTask =
        editEl.isTaskCard ||
        editEl.customType === "taskCard" ||
        (editEl.text && (editEl.text.includes("☐") || editEl.text.includes("☑")));
      if (isTask) {
        const formatted = formatTaskCardText(editEl.text || "");
        if (formatted !== editEl.text) {
          editEl.text = formatted;
          editEl.originalText = formatted;
        }
      }
    }

    setCanvasState((prev: any) => {
      if (
        prev &&
        prev.zoom?.value === appState.zoom?.value &&
        prev.scrollX === appState.scrollX &&
        prev.scrollY === appState.scrollY &&
        Object.keys(prev.selectedElementIds || {}).length ===
          Object.keys(appState.selectedElementIds || {}).length
      ) {
        return prev;
      }
      return appState;
    });

    // Cancel previous timer
    if (saveTimeRef?.current) {
      clearTimeout(saveTimeRef?.current);
    }

    // Debounce save by 2 seconds after user stops drawing/editing
    saveTimeRef.current = setTimeout(async () => {
      try {
        await SaveCanvasChanges(elements, appState, files);
      } catch (err) {
        console.warn("Auto-save error caught:", err);
      }
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
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.warn("Canvas save unauthorized (401). User session may be unauthenticated.");
      } else {
        console.error("Failed to save whiteboard:", error);
      }
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
        resolveSelection(elements, selectedIds);
      }, 50);
    };

    const handleDblClick = () => {
      setTimeout(() => {
        const api = excalidrawAPIRef.current;
        if (!api) return;
        const appState = api.getAppState();
        const selectedIds = Object.keys(appState.selectedElementIds || {});
        if (selectedIds.length > 0) {
          const elements = api.getSceneElements();
          const selectedEls = selectedIds
            .map((id) => elements.find((el) => el.id === id))
            .filter(Boolean);
          const firstGid = selectedEls[0]?.groupIds?.[0];
          if (firstGid) {
            let groupTextEl = elements.find(
              (el) => (el.groupIds ?? []).includes(firstGid) && el.type === "text",
            );
            const containerEl = elements.find(
              (el) => (el.groupIds ?? []).includes(firstGid) && el.type === "rectangle" && (el.width ?? 0) >= 150,
            );

            let updatedElements: any[] = [...elements];
            if (!groupTextEl && containerEl) {
              const textId = `note-text-${Date.now()}`;
              const isTask = (containerEl as any).customType === "taskCard";
              const newTextEl: any = {
                id: textId,
                type: "text" as const,
                x: containerEl.x + 16,
                y: containerEl.y + 36,
                width: 208,
                height: 150,
                text: isTask ? "☐ " : "Double-click to edit",
                fontSize: 16,
                fontFamily: 1,
                textAlign: "left",
                verticalAlign: "top",
                containerId: containerEl.id,
                strokeColor: containerEl.strokeColor || "#1e293b",
                groupIds: [firstGid],
                isTaskCard: isTask,
                customType: isTask ? "taskCard" : "sticky",
              };
              groupTextEl = newTextEl;
              updatedElements.push(newTextEl);
            }

            if (groupTextEl) {
              let targetEl: any = {
                ...groupTextEl,
                x: containerEl ? containerEl.x + 16 : groupTextEl.x,
                y: containerEl ? containerEl.y + 36 : groupTextEl.y,
                width: 208,
                textAlign: "left",
                verticalAlign: "top",
              };

              // If text is placeholder, clear it on double-click so user can type immediately
              if (
                targetEl.text?.includes("Double-click") ||
                targetEl.text?.includes("Add your note") ||
                targetEl.text?.includes("Add note...")
              ) {
                targetEl = { ...targetEl, text: "", originalText: "" };
              }

              const isTask =
                targetEl.isTaskCard ||
                targetEl.customType === "taskCard" ||
                targetEl.text?.includes("☐") ||
                targetEl.text?.includes("☑");
              if (isTask && (!targetEl.text || targetEl.text === "")) {
                targetEl = { ...targetEl, text: "☐ ", originalText: "☐ " };
              }

              updatedElements = updatedElements.map((el) =>
                el.id === targetEl.id ? targetEl : el,
              );

              api.updateScene({
                elements: updatedElements,
                appState: {
                  selectedElementIds: { [targetEl.id]: true },
                  editingTextElement: targetEl,
                },
              });
            }
          }
        }
      }, 50);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const api = excalidrawAPIRef.current;
        if (!api) return;
        const appState = api.getAppState();
        // If user is actively typing in text input, let normal backspace work!
        if (appState.editingTextElement || (appState as any).editingElement) return;

        const selectedIds = Object.keys(appState.selectedElementIds || {});
        if (selectedIds.length === 0) return;

        const elements = api.getSceneElements();
        const idsToDelete = new Set<string>();

        selectedIds.forEach((id) => {
          const el = elements.find((item) => item.id === id);
          if (el) {
            idsToDelete.add(el.id);
            const gids = el.groupIds ?? [];
            gids.forEach((gid: string) => {
              elements.forEach((item) => {
                if ((item.groupIds ?? []).includes(gid)) {
                  idsToDelete.add(item.id);
                }
              });
            });
            if ((el as any).containerId) {
              idsToDelete.add((el as any).containerId);
            }
            elements.forEach((item: any) => {
              if (item.containerId === el.id) {
                idsToDelete.add(item.id);
              }
            });
          }
        });

        if (idsToDelete.size > 0) {
          e.preventDefault();
          e.stopPropagation();

          const now = Date.now() + 1;
          const updatedElements = elements.map((item) => {
            if (idsToDelete.has(item.id)) {
              return {
                ...item,
                isDeleted: true,
                version: (item.version ?? 1) + 1,
                versionNonce: Math.floor(Math.random() * 2000000000),
                updated: now,
              };
            }
            return item;
          });

          api.updateScene({
            elements: updatedElements,
            appState: { selectedElementIds: {} },
          });
          setSelectedElement(null);
          setSelectedGroupId(null);
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("dblclick", handleDblClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dblclick", handleDblClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // empty deps — always reads fresh API from ref

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
    const topY = selectedElement.y;
    const screenY = (topY + scrollY) * zoom;

    return {
      left: screenX,
      top: screenY - 12,
    };
  };

  const getResolvedGroupId = (elements: readonly any[], el: any): string | null => {
    if (!el) return null;
    if (selectedGroupId) return selectedGroupId;
    if (el.groupIds?.[0]) return el.groupIds[0];
    if ((el as any).containerId) {
      const containerEl = elements.find((e) => e.id === (el as any).containerId);
      return containerEl?.groupIds?.[0] ?? null;
    }
    const childText = elements.find((e: any) => e.containerId === el.id);
    return childText?.groupIds?.[0] ?? null;
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const targetGid = getResolvedGroupId(elements, selectedElement);
    const now = Date.now() + 1;
    const updatedElements = elements.map((el) => {
      const isMatch = targetGid
        ? (el.groupIds ?? []).includes(targetGid)
        : el.id === selectedElement.id;
      if (isMatch) {
        return {
          ...el,
          [property]: value,
          version: (el.version ?? 1) + 1,
          versionNonce: Math.floor(Math.random() * 2000000000),
          updated: now,
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
    const targetGid = getResolvedGroupId(elements, selectedElement);
    const boundTextIds = (selectedElement.boundElements ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.id);

    const idsToDelete = new Set<string>();
    idsToDelete.add(selectedElement.id);
    boundTextIds.forEach((tid: string) => idsToDelete.add(tid));

    elements.forEach((el: any) => {
      if (targetGid && (el.groupIds ?? []).includes(targetGid)) {
        idsToDelete.add(el.id);
      }
      if ((el as any).containerId && idsToDelete.has((el as any).containerId)) {
        idsToDelete.add(el.id);
      }
      if ((selectedElement as any).containerId && el.id === (selectedElement as any).containerId) {
        idsToDelete.add(el.id);
      }
    });

    const now = Date.now() + 1;
    const updatedElements = elements.map((el) => {
      if (idsToDelete.has(el.id)) {
        return {
          ...el,
          isDeleted: true,
          version: (el.version ?? 1) + 1,
          versionNonce: Math.floor(Math.random() * 2000000000),
          updated: now,
        };
      }
      return el;
    });
    excalidrawAPI.updateScene({ elements: updatedElements });
    setSelectedElement(null);
    setSelectedGroupId(null);
  };

  const handleDuplicate = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const OFFSET = 20;
    const targetGid = getResolvedGroupId(elements, selectedElement);
    const now = Date.now() + 1;

    if (targetGid) {
      // Duplicate all elements in the group with a new shared groupId
      const newGid = `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const groupEls = elements.filter((el) => (el.groupIds ?? []).includes(targetGid));
      const idMap = new Map<string, string>();
      groupEls.forEach((el) => {
        idMap.set(el.id, `${el.id}_copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      });

      const cloned = groupEls.map((el: any) => {
        const newId = idMap.get(el.id)!;
        const newContainerId = el.containerId ? idMap.get(el.containerId) || el.containerId : undefined;
        const newBoundElements = Array.isArray(el.boundElements)
          ? el.boundElements.map((b: any) => ({
              ...b,
              id: idMap.get(b.id) || b.id,
            }))
          : undefined;

        return {
          ...el,
          id: newId,
          x: el.x + OFFSET,
          y: el.y + OFFSET,
          groupIds: [newGid],
          containerId: newContainerId,
          boundElements: newBoundElements,
          version: (el.version ?? 1) + 1,
          versionNonce: Math.floor(Math.random() * 2000000000),
          updated: now,
          ...(Array.isArray(el.points)
            ? {
                points: el.points.map((p: any) => [...p]),
                startBinding: undefined,
                endBinding: undefined,
              }
            : {}),
        };
      });
      excalidrawAPI.updateScene({ elements: [...elements, ...cloned] });
    } else {
      const newElement: any = {
        ...selectedElement,
        id: `${selectedElement.id}_copy_${Date.now()}`,
        x: selectedElement.x + OFFSET,
        y: selectedElement.y + OFFSET,
        containerId: undefined,
        boundElements: undefined,
        version: (selectedElement.version ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        updated: now,
      };
      if (Array.isArray(selectedElement.points)) {
        newElement.points = selectedElement.points.map((p: any) => [...p]);
        delete newElement.startBinding;
        delete newElement.endBinding;
      }
      excalidrawAPI.updateScene({ elements: [...elements, newElement] });
    }
  };

  const handleLock = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const isLocked = !selectedElement.isLocked;
    handlePropertyChange("isLocked", isLocked);
  };

  const handleBringToFront = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const targetGid = getResolvedGroupId(elements, selectedElement);
    const now = Date.now() + 1;

    if (targetGid) {
      const groupEls = elements.filter((el) => (el.groupIds ?? []).includes(targetGid));
      const rest = elements.filter((el) => !(el.groupIds ?? []).includes(targetGid));
      const updatedGroup = groupEls.map((el) => ({
        ...el,
        version: (el.version ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        updated: now,
      }));
      excalidrawAPI.updateScene({ elements: [...rest, ...updatedGroup] });
    } else {
      const target = elements.find((el) => el.id === selectedElement.id);
      if (!target) return;
      const rest = elements.filter((el) => el.id !== selectedElement.id);
      const updatedTarget = {
        ...target,
        version: (target.version ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        updated: now,
      };
      excalidrawAPI.updateScene({ elements: [...rest, updatedTarget] });
    }
  };

  const handleSendToBack = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const targetGid = getResolvedGroupId(elements, selectedElement);
    const now = Date.now() + 1;

    if (targetGid) {
      const groupEls = elements.filter((el) => (el.groupIds ?? []).includes(targetGid));
      const rest = elements.filter((el) => !(el.groupIds ?? []).includes(targetGid));
      const updatedGroup = groupEls.map((el) => ({
        ...el,
        version: (el.version ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        updated: now,
      }));
      excalidrawAPI.updateScene({ elements: [...updatedGroup, ...rest] });
    } else {
      const target = elements.find((el) => el.id === selectedElement.id);
      if (!target) return;
      const rest = elements.filter((el) => el.id !== selectedElement.id);
      const updatedTarget = {
        ...target,
        version: (target.version ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        updated: now,
      };
      excalidrawAPI.updateScene({ elements: [updatedTarget, ...rest] });
    }
  };

  const floatingPosition = getFloatingPosition();

  return (
    <div className="relative" style={{ height: "90vh" }}>
      <Excalidraw
        //@ts-ignore
        excalidrawAPI={handleExcalidrawRef}
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
      <div className="absolute left-4 top-4 z-50 flex flex-col gap-1 rounded-2xl bg-white border p-1.5 shadow-xl">
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
        {/* Divider */}
        <div className="mx-auto my-1 h-px w-8 bg-gray-200" />
        {/* Help button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-primary/10 hover:cursor-pointer"
          title="Keyboard shortcuts"
          onClick={() => setShowHelp(true)}
        >
          <HelpCircle size="19" className="text-gray-400" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <p className="font-bold text-gray-900 text-base">Keyboard Shortcuts</p>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-700 transition"><X size={18}/></button>
            </div>
            <div className="p-5 flex flex-col gap-2 text-sm">
              {[
                ['V', 'Selection'],
                ['H', 'Hand / Pan'],
                ['R', 'Rectangle'],
                ['D', 'Diamond'],
                ['O', 'Ellipse'],
                ['A', 'Arrow'],
                ['L', 'Line'],
                ['P / X', 'Freedraw'],
                ['T', 'Text'],
                ['Ctrl + Z', 'Undo'],
                ['Ctrl + Y', 'Redo'],
                ['Ctrl + C', 'Copy'],
                ['Ctrl + V', 'Paste'],
                ['Delete', 'Delete element'],
                ['Ctrl + A', 'Select all'],
                ['Ctrl + +/-', 'Zoom in / out'],
              ].map(([key, action]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-500">{action}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono text-gray-700">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Original AI Sparkle button — same level as bottom toolbar */}
      <div className="absolute right-6 z-50" style={{ bottom: 20 }}>
        <button
          onClick={() => setShowAiSidebar(!ShowAiSidebar)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 20px",
            background: ShowAiSidebar
              ? "linear-gradient(135deg,#1e40af,#1e3a8a)"
              : "linear-gradient(135deg,#2563eb,#1d4ed8)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            lineHeight: 1,
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
            transition: "all 0.18s ease",
          }}
        >
          <Sparkles size={16} style={{ flexShrink: 0 }} />
          <span style={{ lineHeight: 1 }}>AI</span>
        </button>
      </div>
      {/* Bottom center toolbar pill */}
      <BottomToolbar
        excalidrawAPI={excalidrawAPI}
        aiOpen={ShowAiSidebar}
        onToggleAI={() => setShowAiSidebar((v) => !v)}
      />
      {ShowAiSidebar && <AIFloatingSidebar onClose={() => setShowAiSidebar(false)} excalidrawAPI={excalidrawAPI}/>}
    </div>
  );
}

export default Whiteboard;
