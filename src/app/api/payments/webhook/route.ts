// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Only handle checkout.session.completed for now
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    const bookingId = session.metadata?.bookingId;

    if (paymentId && bookingId) {
      // Fetch the payment record to get the original amount
      const paymentRecord = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (paymentRecord) {
        const amount = paymentRecord.amount;
        // Calculate commission and net amount (10 % commission)
        const commission = parseFloat((amount * 0.10).toFixed(2));
        const netAmount = parseFloat((amount - commission).toFixed(2));

        // Update payment record with status and Stripe identifiers
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            stripePaymentIntentId: session.payment_intent as string,
            commission,
            netAmount,
          },
        });

        // Mark the booking as confirmed
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' },
        });

        // Fetch booking with related users and lesson to send notifications
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            lesson: true,
            student: true,
            teacher: true,
          },
        });
        if (booking) {
          // Send email to student
          if (booking.student.email) {
            await sendEmail({
              to: booking.student.email,
              subject: 'Mentoro: Payment Successful',
              text: `Your payment for the lesson "${booking.lesson.title}" has been processed successfully. Enjoy your session!`,
            });
          }
          // Send email to teacher
          if (booking.teacher.email) {
            await sendEmail({
              to: booking.teacher.email,
              subject: 'Mentoro: You received a payment',
              text: `A payment for the lesson "${booking.lesson.title}" has been completed. You will receive ${netAmount.toFixed(2)} after platform commission.`,
            });
          }
          // In‑app notifications
          await prisma.notification.createMany({
            data: [
              {
                userId: booking.studentId,
                type: 'PAYMENT_COMPLETED',
                message: `Your payment for "${booking.lesson.title}" was successful.`,
                link: `/bookings/${booking.id}`,
              },
              {
                userId: booking.teacherId,
                type: 'PAYMENT_RECEIVED',
                message: `You received a payment for "${booking.lesson.title}".`,
                link: `/bookings/${booking.id}`,
              },
            ],
          });
        }
      }
    }
  }

  // Always return 200 so Stripe knows the webhook was received
  return new Response('Webhook received', { status: 200 });
}
