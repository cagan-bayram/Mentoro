import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(500),
  bookingId: z.string(),
  teacherId: z.string(),
  studentId: z.string(),
});

// GET /api/reviews - Get reviews (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const bookingId = searchParams.get('bookingId');

    const where: any = {};

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    const reviews = await prisma.bookingReview.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
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
    const { rating, comment, bookingId, teacherId, studentId } = reviewSchema.parse(body);

    // Verify the student is creating the review
    if (studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only create reviews for yourself' },
        { status: 403 }
      );
    }

    // Check if the booking exists and belongs to the student
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        studentId: session.user.id,
        teacherId: teacherId,
        status: 'COMPLETED',
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not completed' },
        { status: 404 }
      );
    }

    // Check if a review already exists for this booking
    const existingReview = await prisma.bookingReview.findFirst({
      where: {
        bookingId: bookingId,
        studentId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.bookingReview.create({
      data: {
        rating,
        comment,
        bookingId,
        teacherId,
        studentId: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Update teacher's average rating
    const teacherReviews = await prisma.bookingReview.findMany({
      where: { teacherId },
      select: { rating: true },
    });

    const averageRating = teacherReviews.length > 0 ? teacherReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / teacherReviews.length : 0;

    await prisma.user.update({
      where: { id: teacherId },
      data: { averageRating },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 