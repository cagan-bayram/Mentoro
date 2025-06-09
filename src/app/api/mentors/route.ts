import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mentors = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        expertise: true,
        hourlyRate: true,
        image: true,
      },
    });

    return NextResponse.json(mentors);
  } catch (error) {
    console.error("[MENTORS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 