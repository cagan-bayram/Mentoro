import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/lessons - List lessons (filtered by teacher if teacherId provided)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const courseId = searchParams.get('courseId');
    const isPublished = searchParams.get('isPublished');

    const where: any = {};
    
    if (teacherId) {
      where.teacherId = teacherId;
    }
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    const lessons = await prisma.lesson.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, price, duration, courseId, isPublished } = body;

    // Validate required fields
    if (!title || !description || !duration) {
      return NextResponse.json(
        { error: 'Title, description, and duration are required' },
        { status: 400 }
      );
    }

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Only teachers can create lessons' },
        { status: 403 }
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

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        price: price || 0,
        duration,
        isPublished: isPublished || false,
        courseId: courseId || null,
        teacherId: session.user.id,
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

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
} 