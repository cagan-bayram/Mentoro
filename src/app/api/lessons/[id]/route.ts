import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/lessons/[id] - Get a single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            expertise: true,
            hourlyRate: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id] - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, price, duration, courseId, isPublished } = body;

    // Check if lesson exists and belongs to the teacher
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        teacherId: session.user.id,
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 404 }
      );
    }

    // If courseId is provided, verify the course belongs to the teacher
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          creatorId: session.user.id,
        },
      });

      if (!course) {
        return NextResponse.json(
          { error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        description,
        price,
        duration,
        isPublished,
        courseId: courseId || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if lesson exists and belongs to the teacher
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        teacherId: session.user.id,
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 404 }
      );
    }

    // Check if there are any active bookings for this lesson
    const activeBookings = await prisma.booking.findMany({
      where: {
        lessonId: id,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lesson with active bookings' },
        { status: 400 }
      );
    }

    // Delete all bookings for this lesson (cancelled/completed)
    await prisma.booking.deleteMany({
      where: { lessonId: id },
    });

    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
} 