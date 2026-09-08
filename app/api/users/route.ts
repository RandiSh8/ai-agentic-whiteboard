import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkUser = await currentUser();

    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      body?.email ||
      "guest@example.com";

    const name = clerkUser
      ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "User"
      : body?.name || "Guest User";

    // Check if user already exists in DB
    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(existingUser[0]);
    }

    // Insert new user record
    const newUser = await db
      .insert(users)
      .values({
        name: name,
        email: email,
        credits: 3,
      })
      .returning();

    return NextResponse.json(newUser[0]);
  } catch (error: any) {
    console.error("Error creating/fetching user:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
