import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get('recipientId');
  if (!recipientId) {
    return NextResponse.json(
      { error: 'recipientId query param required' },
      { status: 400 }
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, recipientId },
        { senderId: recipientId, recipientId: session.user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { recipientId, content } = body;
  if (!recipientId || !content) {
    return NextResponse.json(
      { error: 'recipientId and content are required' },
      { status: 400 }
    );
  }
  
  // Create the message
  const message = await prisma.message.create({
    data: {
      content,
      recipientId,
      senderId: session.user.id,
    },
  });

  // Fetch sender/recipient for notification
  const sender = await prisma.user.findUnique({ where: { id: session.user.id } });
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });

  // Send an email to the recipient (optional, can be removed if you only want in‑app notifications)
  if (recipient?.email) {
    await sendEmail({
      to: recipient.email,
      subject: 'Mentoro: New Message',
      text: `${sender?.name || 'A user'} sent you a message: "${content}"`,
    });
  }

  // Create an in-app notification for the recipient
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'NEW_MESSAGE',
      message: `${sender?.name || 'A user'} sent you a message: "${content}"`,
      link: `/messages/${message.id}`,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
