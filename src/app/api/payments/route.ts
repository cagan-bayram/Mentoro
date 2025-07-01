import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/payments - List all payments for the current student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only students can view their payment history
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can view payment history' }, { status: 403 });
    }
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          studentId: session.user.id,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            lesson: {
              select: {
                title: true,
              },
            },
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
} 