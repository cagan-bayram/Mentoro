import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional()
  ),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        creatorId: session.user.id as string,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSE_GET_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;
    const body = await req.json();
    const validatedData = courseSchema.parse(body);

    const existingCourse = await prisma.course.findUnique({
      where: {
        id: courseId,
        creatorId: session.user.id as string,
      },
    });

    if (!existingCourse) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id: courseId,
        creatorId: session.user.id as string,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    console.error("[COURSE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;

    const existingCourse = await prisma.course.findUnique({
      where: {
        id: courseId,
        creatorId: session.user.id as string,
      },
    });

    if (!existingCourse) {
      return new NextResponse("Course not found", { status: 404 });
    }

    await prisma.course.delete({
      where: {
        id: courseId,
        creatorId: session.user.id as string,
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("[COURSE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 