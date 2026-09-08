import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, WhiteboardData } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const { projectName, projectId } = await req.json();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || "guest@example.com";

    if (!projectId || !projectName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.insert(projects).values({
        projectId: projectId,
        projectName: projectName ?? '',
        userEmail: email
    }).onConflictDoUpdate({
        target: [projects.projectId],
        set: { projectName: projectName }
    }).returning();

    return NextResponse.json(result[0]);
}
   
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project Information Missing' }, { status: 400 });
    }

    try {
        const projectResult = await db.select().from(projects).where(eq(projects.projectId, projectId));
        const project = projectResult?.[0];
        const projectName = project?.projectName || "Untitled Board";

        const result = await db.select().from(WhiteboardData).where(eq(WhiteboardData.projectId, projectId));

        if (result && result.length > 0) {
            return NextResponse.json({
                ...result[0],
                projectName: projectName,
            });
        }

        // Default initial board object matching the structure in the tutorial
        const defaultBoard = {
            id: 1,
            projectId: projectId,
            projectName: projectName,
            elements: [],
            appState: { name: projectName, zoom: { value: 1 } },
            files: {},
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json(defaultBoard);
    } catch (err: any) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json({
            id: 1,
            projectId: projectId,
            projectName: "Untitled Board",
            elements: [],
            appState: { name: "Untitled Board", zoom: { value: 1 } },
            files: {},
            updatedAt: new Date().toISOString()
        });
    }
}
