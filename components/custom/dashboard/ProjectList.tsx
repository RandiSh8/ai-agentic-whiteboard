"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import CreateNewBoardDialog from "./CreateNewBoardDialog";
import { Layout, Loader2, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/toast";
import { UserDetailContext } from "@/context/UserDetailContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ProjectItem {
  id: number;
  projectId: string;
  projectName: string;
  userEmail: string;
  createdAt: string;
  updatedAt?: string;
  image?: string | null;
}

function ProjectList() {
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/projects");
      if (Array.isArray(res.data)) {
        setProjectList(res.data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const handleDelete = async () => {
    if (!deleteProjectId) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`/api/projects?projectId=${deleteProjectId}`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== deleteProjectId));
        if (setUserDetail && userDetail) {
          setUserDetail({
            ...userDetail,
            credits: Math.min(3, (userDetail.credits ?? 0) + 1)
          });
        }
        toast.add({ title: "Board moved to archive", type: "success" });
      }
    } catch (err) {
      console.error("Failed to archive project:", err);
      toast.add({ title: "Failed to archive board", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your boards...</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {projectList.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center p-12 border rounded-2xl mt-6 gap-3 bg-muted/20 border-dashed">
          <Image src="/folder.png" alt="Folder" width={90} height={90} />
          <h2 className="text-2xl font-bold">No Board Found</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            Create your first board to start brainstorming, sketching, and planning!
          </p>
          <CreateNewBoardDialog>
            <Button className="w-auto mt-2">+ Create New Board</Button>
          </CreateNewBoardDialog>
        </div>
      ) : (
        <div>
          {/* Header matching tutorial: "Your Boards" */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Your Boards
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create, organize and continue working on your ideas
              </p>
            </div>
            <CreateNewBoardDialog>
              <Button size="sm" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> New Board
              </Button>
            </CreateNewBoardDialog>
          </div>

          {/* Project List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projectList.map((project) => (
              <div
                key={project.projectId}
                className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300"
              >
                {/* Clickable Card Link to Workspace */}
                <Link
                  href={"/workspace/" + project.projectId}
                  className="flex-1 flex flex-col"
                >
                  {/* Thumbnail Preview */}
                  <div className="h-44 w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-800 p-2">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.projectName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                        <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800">
                          <Layout className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-xs font-medium text-gray-400">Empty Canvas</span>
                      </div>
                    )}
                  </div>

                  {/* Title and Edited Time */}
                  <div className="px-4 pt-3.5 pb-2">
                    <h3
                      className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors"
                      title={project.projectName}
                    >
                      {project.projectName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Edited {getTimeAgo(project.updatedAt || project.createdAt)}
                    </p>
                  </div>
                </Link>

                {/* Bottom Footer Row: "Whiteboard" tag & Delete Button */}
                <div className="px-4 pb-3 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 mt-auto">
                  <span className="text-xs font-medium text-gray-400">
                    Whiteboard
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteProjectId(project.projectId);
                    }}
                    title="Delete board"
                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/60 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Move to Archive Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this board to Archive? You can restore it anytime from the Archived tab in the sidebar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Archiving..." : "Move to Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProjectList;