// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications – list notifications for the signed‑in user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(notifications);
}

// PUT /api/notifications – mark a notification as read
// Body: { id: string }
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Notification id required' }, { status: 400 });
  }
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  return NextResponse.json(updated);
}
