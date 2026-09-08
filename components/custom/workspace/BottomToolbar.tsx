"use client"

import React from "react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { renderToStaticMarkup } from "react-dom/server"
import * as LucideIcons from "lucide-react"
import { Bot, MessageSquareText, Sticker } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  // The emoji picker reads browser APIs, so load it only on the client.
  ssr: false,
})

type NoteTemplate = {
  id: string
  title: string
  subtitle: string
  accent: string
  surface: string
  border: string
  textColor: string
  tagBg: string
  previewTilt: string
}

type IconOption = {
  id: string
  label: string
  icon: React.ElementType<{
    size?: number
    strokeWidth?: number
    className?: string
  }>
  accent: string
}

type Props = {
  onAddNote: (templateId: string) => void
  onAddEmoji: (emoji: string) => void
  onAddIcon: (icon: {
    id: string
    label: string
    svg: string
    accent: string
  }) => void
  onToggleAi: () => void
  isAiOpen: boolean
}

const noteTemplates: NoteTemplate[] = [
  {
    id: "sticky-sun",
    title: "Sticky Note",
    subtitle: "Warm idea card",
    accent: "#f59e0b",
    surface: "#fff7d6",
    border: "#f5c451",
    textColor: "#7c4a03",
    tagBg: "#ffe6a3",
    previewTilt: "-rotate-2",
  },
  {
    id: "glass-note",
    title: "Glass Note",
    subtitle: "Polished meeting note",
    accent: "#2563eb",
    surface: "#eff6ff",
    border: "#93c5fd",
    textColor: "#1d4ed8",
    tagBg: "#dbeafe",
    previewTilt: "rotate-1",
  },
  {
    id: "task-card",
    title: "Task Card",
    subtitle: "Structured checklist tile",
    accent: "#10b981",
    surface: "#ecfdf5",
    border: "#6ee7b7",
    textColor: "#047857",
    tagBg: "#d1fae5",
    previewTilt: "-rotate-1",
  },
]

const iconAccentColors = [
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#14b8a6",
  "#6366f1",
]

const formatIconName = (name: string) => {
  // Convert Lucide component names like MessageSquareText into human-readable labels.
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\d/g, "")
    .trim()
}

const iconOptions: IconOption[] = Object.entries(LucideIcons)
  .filter(([name, value]) => {
    // Keep only renderable icon components and skip helper exports from lucide-react.
    return (
      /^[A-Z]/.test(name) &&
      !name.endsWith("Icon") &&
      name !== "Icon" &&
      (typeof value === "function" ||
        (typeof value === "object" && value !== null))
    )
  })
  .map(([name, value], index) => ({
    id: name,
    label: formatIconName(name),
    icon: value as IconOption["icon"],
    accent: iconAccentColors[index % iconAccentColors.length],
  }))

function FloatingActionBar({
  onAddNote,
  onAddEmoji,
  onAddIcon,
  onToggleAi,
  isAiOpen,
}: Props) {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onAddEmoji(emojiData.emoji)
  }

  const addSvgColor = (svg: string, color: string) => {
    // Excalidraw stores icons as SVG image files, so inject the desired color before adding the file.
    return svg.replace("<svg", `<svg color="${color}"`)
  }

  const handleIconClick = (icon: IconOption) => {
    const Icon = icon.icon

    // Render the chosen Lucide icon to SVG markup that Whiteboard can register as an image file.
    const svg = renderToStaticMarkup(
      <Icon
        size={96}
        strokeWidth={2}
        className=""
      />
    )

    onAddIcon({
      id: icon.id,
      label: icon.label,
      svg: addSvgColor(svg, icon.accent),
      accent: icon.accent,
    })
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-[90] -translate-x-1/2 px-2">
      <div className="inline-flex items-center justify-center rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-center gap-1.5">

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                />
              }
            >
              <MessageSquareText size={18} />
              Notes
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="center"
              sideOffset={14}
              className="w-[340px] rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
            >
              <PopoverHeader className="gap-1">
                <PopoverTitle className="text-base text-gray-900">
                  Add notes
                </PopoverTitle>

                <PopoverDescription className="text-xs text-gray-500">
                  Pick a blank note style for the whiteboard.
                </PopoverDescription>
              </PopoverHeader>

              <div className="grid gap-3">
                {noteTemplates.map((template) => (
                  /* Template ids map to NOTE_TEMPLATES in Whiteboard.tsx. */
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onAddNote(template.id)}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div
                      className={cn(
                        "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border p-3 shadow-sm transition group-hover:scale-[1.02]",
                        template.previewTilt
                      )}
                      style={{
                        backgroundColor: template.surface,
                        borderColor: template.border,
                      }}
                    >
                      <div
                        className="mb-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold"
                        style={{
                          backgroundColor: template.tagBg,
                          color: template.textColor,
                        }}
                      >
                        New
                      </div>

                      <div className="space-y-1.5">
                        <div
                          className="h-2.5 w-12 rounded-full"
                          style={{
                            backgroundColor: template.accent,
                          }}
                        />

                        <div className="h-2 w-14 rounded-full bg-white/80" />

                        <div className="h-2 w-10 rounded-full bg-white/70" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {template.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {template.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700"
                />
              }
            >
              <Sticker size={18} />
              Emoji
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="center"
              sideOffset={14}
              className="w-[380px] rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
            >
              <PopoverHeader className="gap-1">
                <PopoverTitle className="text-base text-gray-900">
                  Emoji and icons
                </PopoverTitle>

                <PopoverDescription className="text-xs text-gray-500">
                  Choose from the picker or scroll the icon library.
                </PopoverDescription>
              </PopoverHeader>

              <Tabs defaultValue="emoji" className="gap-3">
                <TabsList className="w-full rounded-2xl bg-gray-100 p-1">
                  <TabsTrigger
                    value="emoji"
                    className="rounded-xl text-xs font-medium"
                  >
                    Emoji
                  </TabsTrigger>

                  <TabsTrigger
                    value="icons"
                    className="rounded-xl text-xs font-medium"
                  >
                    Icons
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="emoji" className="mt-0">
                  <EmojiPicker
                    width="100%"
                    height={380}
                    onEmojiClick={handleEmojiClick}
                    previewConfig={{ showPreview: false }}
                  />
                </TabsContent>

                <TabsContent value="icons" className="mt-0">
                  <div className="grid max-h-[380px] grid-cols-4 gap-2 overflow-y-auto pr-1">
                    {iconOptions.map((icon) => {
                      const Icon = icon.icon

                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => handleIconClick(icon)}
                          className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white p-2 text-center transition hover:border-gray-300 hover:bg-gray-50"
                          title={icon.label}
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `${icon.accent}1A`,
                              color: icon.accent,
                            }}
                          >
                            <Icon
                              size={19}
                              strokeWidth={2.6}
                            />
                          </div>

                          <span className="max-w-full truncate text-[11px] font-medium text-gray-600">
                            {icon.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <Button
            onClick={onToggleAi}
            className={cn(
              "h-10 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
              isAiOpen
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
            )}
          >
            <Bot size={18} />
            AI Helper
          </Button>

        </div>
      </div>
    </div>
  )
}

type BottomToolbarProps = {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  onToggleAI: () => void;
  aiOpen: boolean;
};

export default function BottomToolbar({
  excalidrawAPI,
  onToggleAI,
  aiOpen,
}: BottomToolbarProps) {
  const getDropPosition = (api: ExcalidrawImperativeAPI) => {
    const appState = api.getAppState();
    const zoom = appState.zoom?.value ?? 1;
    const scrollX = appState.scrollX ?? 0;
    const scrollY = appState.scrollY ?? 0;
    const viewportW = appState.width ?? (typeof window !== "undefined" ? window.innerWidth : 1000);
    const viewportH = appState.height ?? (typeof window !== "undefined" ? window.innerHeight : 800);
    const cx = viewportW / 2 / zoom - scrollX;
    const cy = viewportH / 2 / zoom - scrollY;
    return { x: cx - 120, y: cy - 60 };
  };

  const handleAddNote = async (templateId: string) => {
    if (!excalidrawAPI) return;
    try {
      const { x, y } = getDropPosition(excalidrawAPI);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const templateStyles: Record<string, any> = {
        "sticky-sun": {
          bg: "#fff7d6",
          stroke: "#f5c451",
          textColor: "#7c4a03",
          accentBg: "#f59e0b",
          isTask: false,
        },
        "glass-note": {
          bg: "#eff6ff",
          stroke: "#93c5fd",
          textColor: "#1d4ed8",
          accentBg: "#2563eb",
          isTask: false,
        },
        "task-card": {
          bg: "#ecfdf5",
          stroke: "#6ee7b7",
          textColor: "#047857",
          accentBg: "#10b981",
          isTask: true,
        },
      };

      const style = templateStyles[templateId] || templateStyles["sticky-sun"];
      const isTask = style.isTask;
      const gid = `note-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const containerId = `note-bg-${Date.now()}`;
      const accentId = `note-accent-${Date.now()}`;

      const textContent = isTask
        ? "☐ Task one\n☐ Task two\n☐ Task three"
        : "Double-click to edit";

      const converted = convertToExcalidrawElements([
        {
          type: "rectangle",
          id: containerId,
          x,
          y,
          width: 240,
          height: 200,
          backgroundColor: style.bg,
          strokeColor: style.stroke,
          strokeWidth: 2,
          fillStyle: "solid",
          roundness: { type: 3 },
          groupIds: [gid],
          customType: isTask ? "taskCard" : templateId,
        },
        {
          type: "rectangle",
          id: accentId,
          x: x + 12,
          y: y + 12,
          width: 60,
          height: 10,
          backgroundColor: style.accentBg,
          strokeColor: style.accentBg,
          strokeWidth: 0,
          fillStyle: "solid",
          roundness: { type: 3 },
          groupIds: [gid],
        },
        {
          type: "text",
          id: `note-text-${Date.now()}`,
          x: x + 16,
          y: y + 36,
          width: 208,
          text: textContent,
          fontSize: 16,
          fontFamily: 1,
          strokeColor: style.textColor,
          groupIds: [gid],
          customType: isTask ? "taskCard" : templateId,
          isTaskCard: isTask,
          textAlign: "left",
          verticalAlign: "top",
        },
      ] as any);

      // Tag customType and isTaskCard on text element
      const txtEl = converted.find((el: any) => el.type === "text");
      if (txtEl) {
        (txtEl as any).isTaskCard = isTask;
        (txtEl as any).customType = isTask ? "taskCard" : templateId;
        (txtEl as any).textAlign = "left";
        (txtEl as any).verticalAlign = "top";
      }

      const existing = excalidrawAPI.getSceneElements();
      excalidrawAPI.updateScene({
        elements: [...existing, ...converted],
      });
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const handleAddEmoji = async (emoji: string) => {
    if (!excalidrawAPI) return;
    try {
      const { x, y } = getDropPosition(excalidrawAPI);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const converted = convertToExcalidrawElements([
        {
          type: "text",
          x: x + Math.random() * 60 - 30,
          y: y + Math.random() * 60 - 30,
          text: emoji,
          fontSize: 44,
          customType: "emoji",
          isEmoji: true,
        },
      ] as any);

      const existing = excalidrawAPI.getSceneElements();
      excalidrawAPI.updateScene({ elements: [...existing, ...converted] });
    } catch (err) {
      console.error("Error adding emoji:", err);
    }
  };

  const handleAddIcon = async (icon: {
    id: string
    label: string
    svg: string
    accent: string
  }) => {
    if (!excalidrawAPI) return;
    try {
      const { x, y } = getDropPosition(excalidrawAPI);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const fileId = `file-icon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const base64Svg = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(icon.svg))) : "";
      const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;

      // Register SVG image file in Excalidraw
      excalidrawAPI.addFiles([
        {
          id: fileId as any,
          dataURL: svgDataUrl as any,
          mimeType: "image/svg+xml",
          created: Date.now(),
        },
      ]);

      const converted = convertToExcalidrawElements([
        {
          type: "image",
          fileId: fileId,
          status: "saved",
          scale: [1, 1],
          x: x + Math.random() * 60 - 30,
          y: y + Math.random() * 60 - 30,
          width: 80,
          height: 80,
          customType: "icon",
          isIcon: true,
          locked: false,
        },
      ] as any);

      const existing = excalidrawAPI.getSceneElements();
      excalidrawAPI.updateScene({ elements: [...existing, ...converted] });
    } catch (err) {
      console.error("Error adding icon:", err);
    }
  };

  return (
    <FloatingActionBar
      onAddNote={handleAddNote}
      onAddEmoji={handleAddEmoji}
      onAddIcon={handleAddIcon}
      onToggleAi={onToggleAI}
      isAiOpen={aiOpen}
    />
  );
}
