import { db, users } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const user=await currentUser();
    
    // If user already Exist ?
    if (user){
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
            return NextResponse.json({message:"User email not found"},{status:400});
        }

        const userData=await db.select().from(users).where(
            eq(users.email, userEmail)
        )

        if(userData?.length>0){
            return NextResponse.json(userData[0])
        }else{
            const result=await db.insert(users).values({
                name: user.firstName ?? null,
                email: userEmail,
            }).returning();
            return NextResponse.json(result[0])
        }

    }
    return NextResponse.json({message:"User not found"},{status:404});


    // If user does not exist, create a new user in the database

}
    

