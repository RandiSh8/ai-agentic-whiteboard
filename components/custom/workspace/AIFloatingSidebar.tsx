"use client";
import React, { useState, useRef } from "react";
import {
  PencilRuler,
  Sparkles,
  X,
  Network,
  Monitor,
  Smartphone,
  Workflow,
  ArrowUp,
  Loader2Icon,
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { toast } from "@/components/ui/toast";
import axios from "axios";

const AiTools = [
  {
    name: "Generate Diagrams",
    desc: "Create visual diagrams",
    icon: PencilRuler,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    activeBorder: "border-blue-200",
    example: "E.g. Create a diagram showing the relationship between users, orders, and products in an e-commerce system...",
    prompt: `You are an expert visual diagram generation agent. Convert the user's idea into a clear, structured, professional diagram using Excalidraw-compatible JSON elements only.`,
  },
  {
    name: "Flowchart",
    desc: "Visualize workflows",
    icon: Workflow,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    activeBorder: "border-violet-200",
    example: "E.g. Create a customer onboarding flow with signup, email verification and subscription decision...",
    prompt: `You are an expert flowchart generation agent. Convert the user's description into a professional flowchart using Excalidraw-compatible JSON elements only.`,
  },
  {
    name: "Architecture",
    desc: "Design system architecture",
    icon: Network,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    activeBorder: "border-orange-200",
    example: "E.g. Design a microservices architecture for a food delivery app with auth, orders, payments and notifications...",
    prompt: `You are a senior software architect. Convert the user's system description into a clear architecture diagram using Excalidraw-compatible JSON elements only.`,
  },
  {
    name: "Web Mockup",
    desc: "Generate web wireframes",
    icon: Monitor,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    activeBorder: "border-cyan-200",
    example: "E.g. Design a SaaS dashboard with a sidebar, analytics charts, user table and action buttons...",
    prompt: `You are an expert product designer. Convert the user's description into a professional desktop web wireframe using Excalidraw-compatible JSON elements only.`,
  },
  {
    name: "Mobile Mockup",
    desc: "Generate app wireframes",
    icon: Smartphone,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    activeBorder: "border-pink-200",
    example: "E.g. Design a mobile fitness app with a home screen, workout tracker and progress charts...",
    prompt: `You are an expert mobile product designer. Convert the user's app idea into a professional mobile wireframe using Excalidraw-compatible JSON elements only.`,
  },
];

type Props = {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  onClose: () => void;
};

const AI_PLACEHOLDER_IDS={
    container:"ai-placeholder-container",
    title:"ai-placeholder-title",
    subtitle:"ai-placeholder-subtitle",
    skelton1:"ai-placeholder-skelton1",
    skelton2:"ai-placeholder-skelton2",
    skelton3:"ai-placeholder-skelton3",
    
}

function AIFloatingSidebar({ onClose, excalidrawAPI }: Props) {
  const [selectedTool, setSelectedTool] = useState("Generate Diagrams");
  const AI_PLACEHOLDER_ID='ai-placeholder';
  const [selectedType,setSelectedType]=useState(AiTools[0]);
  const[userInput,setUserInput]=useState('');
  const [Loading,setLoading]=useState(false);
  // Stores actual IDs of placeholder elements (convertToExcalidrawElements generates its own IDs)
  const placeholderIdsRef = useRef<string[]>([]);

  const activeTool = AiTools.find((t) => t.name === selectedTool)!;

  const getEmptyCanvasPosition=()=>{
    if(!excalidrawAPI){
    return {x:100,y:100};
}
const elements=excalidrawAPI.getSceneElements().filter(element=>!element.isDeleted);

if (elements.length==0){
    return {x:100,y:100};
}

// Find rightmost element
const maxRight=Math.max(...elements.map((element)=>element.x+element.width))
const minTop=Math.min(...elements.map((element)=>element.y))
return {
    x:maxRight + 150,
    y:minTop
}

  }

  const addAiPlaceholder = async () => {
    if (!excalidrawAPI) return;
    // Clear any existing placeholder first (prevents duplicates)
    removeAiPlaceholder();
    const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
    const position = getEmptyCanvasPosition();
    const placeholderElements = convertToExcalidrawElements([
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.container,
        x: position.x,
        y: position.y,
        width: 420,
        height: 250,
        backgroundColor: "#f5f3ff",
        strokeColor: "#8b5cf6",
        strokeWidth: 2,
        roughness: 0,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      {
        type: "text",
        id: AI_PLACEHOLDER_IDS.title,
        x: position.x + 28,
        y: position.y + 28,
        text: "✨ Generating with AI",
        fontSize: 22,
        strokeColor: "#6d28d9",
      },
      {
        type: "text",
        id: AI_PLACEHOLDER_IDS.subtitle,
        x: position.x + 28,
        y: position.y + 65,
        text: "Preparing your diagram...",
        fontSize: 15,
        strokeColor: "#6b7280",
      },
      // Skeleton bar 1
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skelton1,
        x: position.x + 28,
        y: position.y + 108,
        width: 200,
        height: 12,
        backgroundColor: "#ddd6fe",
        strokeColor: "#ddd6fe",
        strokeWidth: 0,
        roughness: 0,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      // Skeleton bar 2
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skelton2,
        x: position.x + 28,
        y: position.y + 132,
        width: 250,
        height: 12,
        backgroundColor: "#ddd6fe",
        strokeColor: "#ddd6fe",
        strokeWidth: 0,
        roughness: 0,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      // Skeleton bar 3
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skelton3,
        x: position.x + 28,
        y: position.y + 156,
        width: 130,
        height: 12,
        backgroundColor: "#ddd6fe",
        strokeColor: "#ddd6fe",
        strokeWidth: 0,
        roughness: 0,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
    ], { regenerateIds: false });
    placeholderIdsRef.current = Object.values(AI_PLACEHOLDER_IDS);
    const currentElements = excalidrawAPI.getSceneElements();
    excalidrawAPI.updateScene({
      elements: [...currentElements, ...placeholderElements],
    });
  };

  const removeAiPlaceholder = () => {
    if (!excalidrawAPI) return;
    const placeholderIds = new Set(Object.values(AI_PLACEHOLDER_IDS));
    const elements = excalidrawAPI.getSceneElements();
    const updatedElements = elements.filter(el => !placeholderIds.has(el.id));
    excalidrawAPI.updateScene({ elements: updatedElements });
    placeholderIdsRef.current = [];
  };

  const getSafeText = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.text) return String(val.text);
    return String(val);
  };

  const getConnectionPoints = (
    fromNode: any,
    toNode: any,
    origin: { x: number; y: number }
  ) => {
    const fromX = origin.x + Number(fromNode.x || 0);
    const fromY = origin.y + Number(fromNode.y || 0);
    const fromWidth = Number(fromNode.width || 180);
    const fromHeight = Number(fromNode.height || 70);

    const toX = origin.x + Number(toNode.x || 0);
    const toY = origin.y + Number(toNode.y || 0);
    const toWidth = Number(toNode.width || 180);
    const toHeight = Number(toNode.height || 70);

    const fromCenterX = fromX + fromWidth / 2;
    const fromCenterY = fromY + fromHeight / 2;
    const toCenterX = toX + toWidth / 2;
    const toCenterY = toY + toHeight / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Vertical connection
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (dy > 0) {
        return {
          startX: fromCenterX,
          startY: fromY + fromHeight,
          endX: toCenterX,
          endY: toY
        };
      }
      return {
        startX: fromCenterX,
        startY: fromY,
        endX: toCenterX,
        endY: toY + toHeight
      };
    }

    // Horizontal connection
    if (dx > 0) {
      return {
        startX: fromX + fromWidth,
        startY: fromCenterY,
        endX: toX,
        endY: toCenterY
      };
    }

    return {
      startX: fromX,
      startY: fromCenterY,
      endX: toX + toWidth,
      endY: toCenterY
    };
  };

  const renderAIDiagram = async (diagram: any) => {
    if (!excalidrawAPI) return;

    const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
    const origin = getEmptyCanvasPosition();

    const rawElements = diagram?.elements || [];
    const rawConnections = diagram?.connections || rawElements.filter((el: any) => el.type === "arrow" || el.fromId || el.from);
    const shapesOnly = rawElements.filter((el: any) => el.type !== "arrow" && !el.fromId && !el.from);

    if (!shapesOnly.length) return;

    const getNode = (id: string) => {
      return shapesOnly.find((element: any) => element.id === id);
    };

    // CREATE SHAPES
    const shapeElements = shapesOnly.flatMap((element: any) => {
      if (!element?.type || !element?.id) return [];

      const x = origin.x + (Number(element.x) || 0);
      const y = origin.y + (Number(element.y) || 0);
      const width = Number(element.width) || (element.type === "diamond" ? 140 : 180);
      const height = Number(element.height) || (element.type === "diamond" ? 140 : 70);

      const baseElement = {
        id: element.id,
        type: element.type,
        x,
        y,
        width,
        height,
        strokeColor: element.strokeColor || "#1e1e1e",
        backgroundColor: element.backgroundColor || "transparent",
        strokeWidth: Number(element.strokeWidth) || 2,
        strokeStyle: element.strokeStyle || "solid",
        fillStyle: element.fillStyle || "solid",
        roughness: element.roughness ?? 0,
        opacity: element.opacity ?? 100
      };

      if (element.type === "text") {
        return [
          {
            ...baseElement,
            text: getSafeText(element.text || element.label),
            fontSize: Number(element.fontSize) || 18
          }
        ];
      }

      const labelText = getSafeText(
        typeof element.label === "object" && element.label !== null
          ? element.label.text
          : element.label ?? element.text
      );

      return [
        {
          ...baseElement,
          ...(labelText && {
            label: {
              text: labelText,
              fontSize: Number(element.fontSize) || 18
            }
          })
        }
      ];
    });

    // CREATE CONNECTIONS
    const connectionElements = rawConnections
      .map((connection: any, index: number) => {
        const fromId = connection.from || connection.fromId;
        const toId = connection.to || connection.toId;

        const fromNode = getNode(fromId);
        const toNode = getNode(toId);

        if (!fromNode || !toNode) {
          console.warn("Unable to create connection", connection);
          return null;
        }

        const { startX, startY, endX, endY } = getConnectionPoints(
          fromNode,
          toNode,
          origin
        );

        let deltaX = endX - startX;
        let deltaY = endY - startY;

        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          deltaY = 20;
        }

        return {
          id: connection.id || `connection-${index}`,
          type: "arrow",
          x: startX,
          y: startY,
          points: [[0, 0], [deltaX, deltaY]],
          start: { id: fromId },
          end: { id: toId },
          strokeColor: connection.strokeColor || "#475569",
          strokeWidth: Number(connection.strokeWidth) || 2,
          strokeStyle: connection.strokeStyle || "solid",
          roughness: connection.roughness ?? 0,
          opacity: connection.opacity ?? 100,
          startArrowhead: null,
          endArrowhead: connection.endArrowhead || "arrow",
          ...(connection.label && {
            label: {
              text: getSafeText(connection.label),
              fontSize: Number(connection.fontSize) || 16
            }
          })
        };
      })
      .filter(Boolean);

    const elementsToConvert = [...shapeElements, ...connectionElements];

    const newElements = convertToExcalidrawElements(
      elementsToConvert as any,
      { regenerateIds: false }
    );

    removeAiPlaceholder();

    const placeholderIds = new Set(Object.values(AI_PLACEHOLDER_IDS));
    const currentElements = excalidrawAPI.getSceneElements().filter(
      (e: any) => !e.isDeleted && !placeholderIds.has(e.id)
    );

    excalidrawAPI.updateScene({
      elements: [...currentElements, ...newElements]
    });
  };

  const OnClickGenerate = async () => {
    if (!userInput.trim()) return;
    setLoading(true);

    await addAiPlaceholder();

    const currentAiTool = AiTools.find(tool => tool.name == selectedTool);
    try {
      const result = await axios.post('/api/ai', {
        userInput: userInput,
        type: currentAiTool?.name,
        systemPrompt: currentAiTool?.prompt,
      });
      console.log("AI API response:", result.data);

      const { diagramResult } = result.data;
      if (diagramResult && excalidrawAPI) {
        await renderAIDiagram(diagramResult);
      } else {
        removeAiPlaceholder();
      }
    } catch (error: any) {
      console.error('AI generation failed:', error);
      removeAiPlaceholder();
      let msg = error?.response?.data?.error ?? error?.message ?? 'Unknown error';
      if (typeof msg === 'object') {
        msg = msg.message || JSON.stringify(msg);
      }
      toast.add({ type: 'error', title: 'AI Generation Failed', description: String(msg) });
    } finally {
      setLoading(false);
    }
  };
    
  return (
    <div
      className="
        absolute
        z-[9999]
        right-6
        bottom-20
        w-[390px]
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)]
      "
    >
      {/* ================= HEADER ================= */}
      <div
        className="
          relative
          overflow-hidden
          border-b
          border-gray-100
          px-5
          pt-5
          pb-4
        "
      >
        {/* Decorative background glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-32
            w-32
            rounded-full
            bg-blue-100/50
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -left-10
            top-10
            h-24
            w-24
            rounded-full
            bg-violet-100/40
            blur-3xl
          "
        />

        <div className="relative flex items-start justify-between">
          {/* AI Icon + Title */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-blue-600
                to-violet-600
                text-white
                shadow-lg
                shadow-blue-500/20
              "
            >
              <Sparkles size={19} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="
                    text-[17px]
                    font-bold
                    tracking-tight
                    text-gray-900
                  "
                >
                  AI Helper
                </h2>

                <span
                  className="
                    rounded-full
                    bg-green-50
                    px-2
                    py-0.5
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-green-600
                  "
                >
                  AI
                </span>
              </div>

              <p className="mt-0.5 text-xs text-gray-500">
                Turn ideas into visuals in seconds
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-700
            "
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ================= AI TOOLS ================= */}
      <div className="px-5 pt-4">
        {/* Section Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-gray-500
            "
          >
            What do you want to create?
          </h3>

          <span className="text-[10px] text-gray-400">
            {AiTools.length} tools
          </span>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-2 gap-2">
          {AiTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.name;

            return (
              <button
                type="button"
                key={tool.name}
                onClick={() => setSelectedTool(tool.name)}
                className={`
                  group
                  flex
                  items-center
                  gap-2.5
                  rounded-xl
                  border
                  p-2.5
                  text-left
                  transition-all
                  duration-200

                  ${
                    isSelected
                      ? `${tool.activeBorder} bg-gray-50 shadow-sm`
                      : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    ${tool.bgColor}
                    ${tool.color}
                    transition-transform
                    duration-200
                    group-hover:scale-105
                  `}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>

                {/* Tool Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      text-[11px]
                      font-semibold
                      text-gray-900
                    "
                  >
                    {tool.name}
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-[9px]
                      text-gray-400
                    "
                  >
                    {tool.desc}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div
                    className="
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-blue-600
                    "
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PROMPT SECTION ================= */}
      <div className="px-5 pb-5 pt-5">
        <div
          className="
            rounded-xl
            border
            border-gray-200
            bg-gray-50/70
            p-3
            transition
            focus-within:border-blue-300
            focus-within:bg-white
            focus-within:ring-4
            focus-within:ring-blue-50
          "
        >
          {/* Prompt Header */}
          <div className="mb-1 flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-gray-800">
                Describe your idea
              </label>
              <p className="text-[10px] text-gray-400 mt-0.5">
                AI will generate it directly on your canvas
              </p>
            </div>

            <Sparkles
              size={14}
              className="text-blue-500 shrink-0"
            />
          </div>

          {/* Textarea */}
          <Textarea
            className="
              min-h-[95px]
              resize-none
              border-0
              bg-transparent
              p-0
              text-xs
              text-gray-700
              shadow-none
              placeholder:text-gray-400
              focus-visible:ring-0
            "
            placeholder={activeTool.example}
            value={userInput}
            onChange={(event)=>setUserInput(event.target.value)}
          />

          {/* Prompt Footer */}
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              border-t
              border-gray-200/70
              pt-3
            "
          >
            {/* Selected Tool Badge */}
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {selectedTool}
            </span>

            {/* Generate Button */}
            <Button
              type="button"
              className="
                h-8
                gap-1.5
                rounded-lg
                bg-gradient-to-r
                from-blue-600
                to-violet-600
                px-3.5
                text-[11px]
                font-semibold
                text-white
                shadow-md
                shadow-blue-500/20
                transition-all
                hover:from-blue-700
                hover:to-violet-700
                hover:shadow-lg
              "
              onClick={OnClickGenerate}
              disabled={Loading}
            >
              <Sparkles size={13} />

              {Loading && <Loader2Icon className="animate-spin"/>}Generate

              <ArrowUp size={13} />
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="
            mt-2
            text-center
            text-[9px]
            text-gray-400
          "
        >
          AI generated content can be edited afterwards
        </p>
      </div>
    </div>
  );
}

export default AIFloatingSidebar;

