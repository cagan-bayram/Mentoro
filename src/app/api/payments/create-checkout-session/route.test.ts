// src/app/api/payments/create-checkout-session/route.test.ts
import { POST as createCheckout } from './route';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

jest.mock('stripe', () => {
  const MockStripe = jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://checkout.test' }),
      },
    },
    webhooks: { constructEvent: jest.fn() },
  }));
  return MockStripe;
});

jest.mock('@/lib/prisma', () => ({ prisma: {
  booking: { findUnique: jest.fn().mockResolvedValue({ id: 'b1', price: 50, studentId: 's1', teacherId: 't1', lesson: { title: 'Lesson', description: 'Desc' }, payment: null }) },
  payment: {
    upsert: jest.fn().mockResolvedValue({ id: 'p1' }),
    update: jest.fn().mockResolvedValue({}),
  },
} }));

const mockSession = { user: { id: 's1', email: 'student@test.com' } };

jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue(mockSession) }));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

jest.mock('next/server', () => ({ NextResponse: {
  json: (data: any, init?: any) => ({ data, status: init?.status }),
}, NextRequest: jest.fn() }));

// Replace with your own test runner utilities

test('creates a stripe session with paymentId in metadata', async () => {
  const req = { json: () => Promise.resolve({ bookingId: 'b1' }) } as any;
  const res = await createCheckout(req as any);
  // ensure stripe.checkout.sessions.create was called
  const stripeInstance: any = (Stripe as unknown as jest.Mock).mock.results[0].value;
  expect(stripeInstance.checkout.sessions.create).toHaveBeenCalled();
  const args = stripeInstance.checkout.sessions.create.mock.calls[0][0];
  expect(args.metadata.paymentId).toBe('p1');
  expect(args.metadata.bookingId).toBe('b1');
});
