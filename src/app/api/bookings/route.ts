import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';
import { rateLimit } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';

// GET /api/bookings - List bookings (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    
    // Filter by user role
    if (session.user.role === 'STUDENT') {
      where.studentId = session.user.id;
    } else if (session.user.role === 'TEACHER') {
      where.teacherId = session.user.id;
    }
    
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        lesson: {
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
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        payment: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
const bookingSchema = z.object({
  lessonId: z.string(),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid start time'),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid end time'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can book lessons' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessonId, startTime, endTime } = bookingSchema.parse(body);

    if (!rateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check if lesson exists and is published
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teacher: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    if (!lesson.isPublished) {
      return NextResponse.json(
        { error: 'Lesson is not available for booking' },
        { status: 400 }
      );
    }

    // Check if student is trying to book their own lesson
    if (lesson.teacherId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot book your own lesson' },
        { status: 400 }
      );
    }

    // Check for booking conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        lessonId,
        OR: [
          {
            startTime: {
              lte: new Date(startTime),
            },
            endTime: {
              gt: new Date(startTime),
            },
          },
          {
            startTime: {
              lt: new Date(endTime),
            },
            endTime: {
              gte: new Date(endTime),
            },
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 400 }
      );
    }

    // Calculate price based on lesson duration and teacher's hourly rate
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const price = lesson.price || (lesson.teacher.hourlyRate || 0) * durationHours;

    const booking = await prisma.booking.create({
      data: {
        lessonId,
        studentId: session.user.id,
        teacherId: lesson.teacherId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price,
        status: 'PENDING',
      },
      include: {
        lesson: {
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
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // After creating the booking record, create a payment and notify the teacher
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: price,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    // Notify the teacher of the new booking via email and in‑app notification
    const teacher = await prisma.user.findUnique({ where: { id: booking.teacherId } });
    const student = await prisma.user.findUnique({ where: { id: booking.studentId } });
    if (teacher?.email) {
      await sendEmail({
        to: teacher.email,
        subject: 'Mentoro: New Booking Request',
        text: `${student?.name || 'A student'} has booked your lesson "${lesson.title}". Please confirm or decline the booking in your dashboard.`,
      });
    }
    await prisma.notification.create({
      data: {
        userId: booking.teacherId,
        type: 'NEW_BOOKING',
        message: `${student?.name || 'A student'} booked your lesson "${lesson.title}"`,
        link: `/teacher/bookings/${booking.id}`,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}