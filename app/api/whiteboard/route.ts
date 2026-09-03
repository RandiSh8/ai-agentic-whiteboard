import { NextRequest, NextResponse } from "next/server";
import { db, WhiteboardData, projects } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { projectId, elements, appState, files } = await req.json();
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized User" }, { status: 401 });
        }

        if (!projectId) {
            return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
        }

        // Ensure project exists in projects table to satisfy foreign key constraint
        const existingProject = await db.select().from(projects).where(eq(projects.projectId, projectId));
        if (!existingProject || existingProject.length === 0) {
            await db.insert(projects).values({
                projectId: projectId,
                projectName: "Untitled Board",
                userEmail: user.primaryEmailAddress?.emailAddress || ""
            });
        }

        const result = await db.insert(WhiteboardData).values({
            projectId: projectId,
            elements: elements,
            appState: appState,
            files: files
        }).onConflictDoUpdate({
            target: [WhiteboardData.projectId],
            set: {
                elements: elements,
                appState: appState,
                files: files,
                updatedAt: new Date()
            }
        }).returning();

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error("Whiteboard save error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}