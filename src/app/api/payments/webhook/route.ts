import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

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

  // Handle the event
  // inside the existing event handler for checkout.session.completed
if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  const paymentId = session.metadata?.paymentId;
  if (bookingId && paymentId) {
    const paymentRecord = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (paymentRecord) {
      const amount = paymentRecord.amount;
      const commission = parseFloat((amount * 0.10).toFixed(2));
      const netAmount = parseFloat((amount - commission).toFixed(2));

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          stripePaymentIntentId: session.payment_intent as string,
          commission,
          netAmount,
        },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });
    }
  }
}


  // Respond to Stripe
  return new Response('Webhook received', { status: 200 });
} 