import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const { mentorId } = await params;

    const mentor = await prisma.user.findUnique({
      where: {
        id: mentorId,
        role: "TEACHER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        education: true,
        experience: true,
        expertise: true,
        hourlyRate: true,
        image: true,
        courses: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
          },
        },
        lessons: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    if (!mentor) {
      return new NextResponse("Mentor not found", { status: 404 });
    }

    return NextResponse.json(mentor);
  } catch (error) {
    console.error("[MENTOR_GET_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 