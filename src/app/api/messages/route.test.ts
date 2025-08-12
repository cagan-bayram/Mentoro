// src/app/api/messages/route.test.ts
import { POST as sendMessage } from './route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/email', () => ({ sendEmail: jest.fn() }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }) }));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

jest.mock('@/lib/prisma', () => ({ prisma: {
  message: { create: jest.fn().mockResolvedValue({ id: 'm1', content: 'hi', recipientId: 'u2', senderId: 'u1' }) },
  user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@test.com' }) },
  notification: { create: jest.fn().mockResolvedValue({}) },
} }));

jest.mock('next/server', () => ({ NextResponse: {
  json: (data: any, init?: any) => ({ data, status: init?.status }),
}, NextRequest: jest.fn() }));

test('creates a notification when a message is sent', async () => {
  const req = { json: () => Promise.resolve({ recipientId: 'u2', content: 'Hello' }) } as any;
  const res = await sendMessage(req as any);
  expect(prisma.notification.create).toHaveBeenCalled();
  const notifArgs = (prisma.notification.create as jest.Mock).mock.calls[0][0].data;
  expect(notifArgs.userId).toBe('u2');
  expect(notifArgs.type).toBe('NEW_MESSAGE');
});
