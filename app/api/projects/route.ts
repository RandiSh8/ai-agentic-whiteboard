import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, WhiteboardData, users } from "@/db/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const { projectName, projectId } = await req.json();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || "guest@example.com";

    if (!projectId || !projectName) {
        return NextResponse.json({ error: 'Project Information missing' }, { status: 400 });
    }

    // Check if updating existing project
    const existingProject = await db.select().from(projects).where(eq(projects.projectId, projectId));
    if (existingProject && existingProject.length > 0) {
        const updated = await db.update(projects)
            .set({ projectName: projectName })
            .where(eq(projects.projectId, projectId))
            .returning();
        return NextResponse.json(updated[0]);
    }

    // User Credits > 0 check
    const userCredits = await db.select().from(users).where(eq(users.email, email));
    if (userCredits.length > 0 && userCredits[0]?.credits !== null && userCredits[0]?.credits !== undefined && userCredits[0]?.credits <= 0) {
        return NextResponse.json({ error: 'Insufficient Credits' }, { status: 400 });
    }

    const result = await db.insert(projects).values({
        projectId: projectId,
        projectName: projectName ?? '',
        userEmail: email
    }).returning();

    if (userCredits.length > 0) {
        await db.update(users).set({
            credits: Math.max(0, Number(userCredits[0]?.credits ?? 3) - 1)
        }).where(eq(users.email, email));
    }

    return NextResponse.json(result[0]);
}
   
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const isArchived = searchParams.get('archived') === 'true';

    // If no projectId is provided, return all projects for the logged-in user
    if (!projectId) {
        try {
            const user = await currentUser();
            const email = user?.primaryEmailAddress?.emailAddress || "guest@example.com";

            const userProjects = await db
                .select({
                    id: projects.id,
                    projectId: projects.projectId,
                    projectName: projects.projectName,
                    userEmail: projects.userEmail,
                    createdAt: projects.createdAt,
                    archived: projects.archived,
                    image: WhiteboardData.image,
                    appState: WhiteboardData.appState,
                    updatedAt: WhiteboardData.updatedAt,
                })
                .from(projects)
                .leftJoin(WhiteboardData, eq(projects.projectId, WhiteboardData.projectId))
                .where(
                    isArchived
                        ? and(eq(projects.userEmail, email), eq(projects.archived, true))
                        : and(eq(projects.userEmail, email), or(eq(projects.archived, false), isNull(projects.archived)))
                )
                .orderBy(desc(projects.createdAt));

            const formatted = userProjects.map((p) => ({
                id: p.id,
                projectId: p.projectId,
                projectName: p.projectName,
                userEmail: p.userEmail,
                createdAt: p.createdAt,
                archived: p.archived,
                updatedAt: p.updatedAt || p.createdAt,
                image: p.image || (p.appState as any)?.image || null,
            }));

            return NextResponse.json(formatted);
        } catch (err: any) {
            console.error("GET /api/projects list error:", err);
            return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
        }
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
                archived: project?.archived || false,
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

export async function DELETE(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const permanent = searchParams.get('permanent') === 'true';
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId) {
        return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
    }

    try {
        const email = user?.primaryEmailAddress?.emailAddress;

        if (permanent) {
            // Permanent hard delete
            await db.delete(WhiteboardData).where(eq(WhiteboardData.projectId, projectId));
            await db.delete(projects).where(eq(projects.projectId, projectId));
        } else {
            // Soft delete: move to archive
            await db.update(projects).set({ archived: true }).where(eq(projects.projectId, projectId));
        }

        // Refund 1 credit (up to 3 max) when board is deleted / archived
        if (email) {
            const userRec = await db.select().from(users).where(eq(users.email, email));
            if (userRec.length > 0) {
                await db.update(users).set({
                    credits: Math.min(3, Number(userRec[0]?.credits ?? 0) + 1)
                }).where(eq(users.email, email));
            }
        }

        return NextResponse.json({
            success: true,
            message: permanent ? "Project permanently deleted" : "Project moved to archive"
        });
    } catch (err: any) {
        console.error("DELETE /api/projects error:", err);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const action = searchParams.get('action'); // 'restore'
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId) {
        return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
    }

    try {
        const email = user?.primaryEmailAddress?.emailAddress;
        if (action === 'restore') {
            if (email) {
                const userCredits = await db.select().from(users).where(eq(users.email, email));
                if (userCredits.length > 0 && userCredits[0]?.credits !== null && userCredits[0]?.credits <= 0) {
                    return NextResponse.json({ error: 'Insufficient credits to restore' }, { status: 400 });
                }
                if (userCredits.length > 0) {
                    await db.update(users).set({
                        credits: Math.max(0, Number(userCredits[0]?.credits ?? 3) - 1)
                    }).where(eq(users.email, email));
                }
            }
            await db.update(projects).set({ archived: false }).where(eq(projects.projectId, projectId));
            return NextResponse.json({ success: true, message: "Project restored successfully" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("PATCH /api/projects error:", err);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}
