"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Layout, Loader2, RotateCcw, Trash2, Archive } from "lucide-react";
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
import { ProjectItem } from "./ProjectList";

function ArchivedProjectList() {
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/projects?archived=true");
      if (Array.isArray(res.data)) {
        setProjectList(res.data);
      }
    } catch (err) {
      console.error("Failed to load archived projects:", err);
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

  const handleRestore = async (projectId: string) => {
    if (userDetail?.credits !== undefined && userDetail.credits <= 0) {
      toast.add({
        type: "error",
        title: "Credit Limit Reached",
        description: "You already have 3 active boards. Delete or archive a board before restoring this one."
      });
      return;
    }
    try {
      setRestoringId(projectId);
      const res = await axios.patch(`/api/projects?projectId=${projectId}&action=restore`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== projectId));
        if (setUserDetail && userDetail) {
          setUserDetail({
            ...userDetail,
            credits: Math.max(0, (userDetail.credits ?? 3) - 1)
          });
        }
        toast.add({ title: "Board restored to dashboard", type: "success" });
      }
    } catch (err: any) {
      console.error("Failed to restore project:", err);
      toast.add({ title: err?.response?.data?.error || "Failed to restore board", type: "error" });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`/api/projects?projectId=${permanentDeleteId}&permanent=true`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== permanentDeleteId));
        toast.add({ title: "Board permanently deleted", type: "success" });
      }
    } catch (err) {
      console.error("Failed to delete project permanently:", err);
      toast.add({ title: "Failed to delete board", type: "error" });
    } finally {
      setDeleting(false);
      setPermanentDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading archived boards...</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Archive className="w-6 h-6 text-primary" />
          Archived Boards
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your archived workspaces. You can restore them to your dashboard or delete them permanently.
        </p>
      </div>

      {projectList.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center p-12 border rounded-2xl mt-6 gap-3 bg-muted/20 border-dashed">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Archive className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Archived Boards</h2>
          <p className="text-muted-foreground text-center max-w-sm text-sm">
            When you remove a board from your dashboard, it will appear here safely in the archive.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-2">Back to Dashboard</Button>
          </Link>
        </div>
      ) : (
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
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
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

              {/* Bottom Footer Row: Restore & Permanent Delete buttons */}
              <div className="px-4 pb-3 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 mt-auto">
                <button
                  onClick={() => handleRestore(project.projectId)}
                  disabled={restoringId === project.projectId}
                  title="Restore to dashboard"
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${restoringId === project.projectId ? 'animate-spin' : ''}`} />
                  Restore
                </button>
                <button
                  onClick={() => setPermanentDeleteId(project.projectId)}
                  title="Delete permanently"
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/60 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={!!permanentDeleteId}
        onOpenChange={(open) => !open && setPermanentDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently erase the whiteboard and all its canvas drawings from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ArchivedProjectList;
