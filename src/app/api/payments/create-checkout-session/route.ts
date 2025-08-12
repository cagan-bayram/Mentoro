// src/app/api/payments/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe once per module. Throw if the secret key is missing.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * POST /api/payments/create-checkout-session
 *
 * Creates a Stripe Checkout Session for an existing booking. A `Payment`
 * record is created (or updated) for the booking if necessary.  The payment
 * ID is stored in the session metadata so the webhook can easily update
 * that record later. The Stripe session ID is persisted on the payment
 * record so you can link back to Stripe if needed.
 */
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

    // Fetch the booking along with its lesson and any existing payment record
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { lesson: true, payment: true },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    // Prevent duplicate checkout once a payment is already completed
    if (booking.payment && booking.payment.status === 'PAID') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    const basePrice = booking.price;
    const totalPriceCents = Math.round(basePrice * 100);

    // Ensure a payment record exists and is in PENDING status
    const paymentRecord = await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        amount: basePrice,
        status: 'PENDING',
      },
      create: {
        bookingId: booking.id,
        amount: basePrice,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    // Create the Stripe Checkout Session.  Attach the payment ID, booking ID,
    // student ID and teacher ID so the webhook can find everything later.
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
            unit_amount: totalPriceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: paymentRecord.id,
        bookingId: booking.id,
        studentId: booking.studentId,
        teacherId: booking.teacherId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/students/bookings?canceled=1`,
      customer_email: session.user.email || undefined,
    });

    // Save the session ID on the payment record for future reference
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
