// src/app/api/payments/checkout/[bookingId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/payments/checkout/[bookingId] – create a Stripe checkout session
export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = params;
    // Fetch the booking and ensure it belongs to the current student
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, lesson: true },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking is not payable' }, { status: 400 });
    }

    const price = booking.price;
    const currency = 'usd';

    // If no payment record exists, create one in PENDING status
    let payment = booking.payment;
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: price,
          currency,
          status: 'PENDING',
        },
      });
    }
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: booking.lesson.title,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings/${booking.id}?payment=cancelled`,
    });

    // Store the Stripe session ID on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
