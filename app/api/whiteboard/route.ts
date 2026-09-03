import { NextRequest, NextResponse } from "next/server";
import { db, WhiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { projectId, elements, appState, files } = await req.json();
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized User" }, { status: 401 });
        }

        if (projectId) {
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
        }

        return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
    } catch (error: any) {
        console.error("Whiteboard save error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}