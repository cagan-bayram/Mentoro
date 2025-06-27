import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLATFORM_COMMISSION = 0.10; // 10%

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Fetch booking and related lesson/teacher
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { lesson: true, payment: true },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.payment && booking.payment.status === 'PAID') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Calculate total price (with commission)
    const basePrice = booking.price;
    const totalPrice = Math.round(basePrice * 100); // in cents
    // Commission is handled in payout, not here

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.lesson.title,
              description: booking.lesson.description,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        studentId: booking.studentId,
        teacherId: booking.teacherId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings?canceled=1`,
      customer_email: session.user.email || undefined,
    });

    // Create or update Payment record
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        stripeSessionId: checkoutSession.id,
        amount: basePrice,
        status: 'PENDING',
      },
      create: {
        bookingId: booking.id,
        amount: basePrice,
        status: 'PENDING',
        currency: 'usd',
        stripeSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 