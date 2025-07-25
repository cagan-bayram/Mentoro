import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    if (booking.studentId !== session.user.id && booking.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, action, proposedStartTime, proposedEndTime } = body;

    // --- Rescheduling logic ---
    if (action) {
      // Fetch booking with all needed fields
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      // Only student or teacher can act
      if (booking.studentId !== session.user.id && booking.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Only allow rescheduling for PENDING or CONFIRMED
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot reschedule this booking' }, { status: 400 });
      }
      // Only one active reschedule at a time
      if (action === "propose_reschedule") {
        if (booking.rescheduleStatus && booking.rescheduleStatus !== "NONE" && booking.rescheduleStatus !== "CANCELLED" && booking.rescheduleStatus !== "DECLINED") {
          return NextResponse.json({ error: 'There is already a pending reschedule request' }, { status: 400 });
        }
        if (!proposedStartTime || !proposedEndTime) {
          return NextResponse.json({ error: 'Proposed start and end time required' }, { status: 400 });
        }
        // Only allow if not already at those times
        if (new Date(proposedStartTime).getTime() === new Date(booking.startTime).getTime() && new Date(proposedEndTime).getTime() === new Date(booking.endTime).getTime()) {
          return NextResponse.json({ error: 'Proposed time is same as current booking' }, { status: 400 });
        }
        // Set reschedule fields
        const updated = await prisma.booking.update({
          where: { id },
          data: {
            proposedStartTime: new Date(proposedStartTime),
            proposedEndTime: new Date(proposedEndTime),
            rescheduleRequestedBy: session.user.role,
            rescheduleStatus: "REQUESTED",
          },
        });
        // Notify the other party
        const recipient = session.user.role === 'STUDENT' ? booking.teacherId : booking.studentId;
        const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
        if (recipientUser?.email) {
          await sendEmail({
            to: recipientUser.email,
            subject: 'Mentoro: Reschedule Requested',
            text: `A new time has been proposed for your lesson booking. Please review and respond in the app.`
          });
        }
        // Create notification
        await prisma.notification.create({
          data: {
            userId: recipient,
            type: 'RESCHEDULE_REQUESTED',
            message: 'A new time has been proposed for your lesson booking.',
            link: `/bookings/${id}`,
          },
        });
        const fullBooking = await prisma.booking.findUnique({
          where: { id },
          include: {
            lesson: {
              include: {
                teacher: { select: { id: true, name: true, email: true, image: true } },
                course: { select: { id: true, title: true } },
              },
            },
            student: { select: { id: true, name: true, email: true, image: true } },
            teacher: { select: { id: true, name: true, email: true, image: true } },
            payment: true,
          },
        });
        return NextResponse.json(fullBooking);
      }
      if (action === "accept_reschedule") {
        // Only the other party can accept
        if (booking.rescheduleRequestedBy === session.user.role) {
          return NextResponse.json({ error: 'You cannot accept your own reschedule request' }, { status: 403 });
        }
        if (booking.rescheduleStatus !== "REQUESTED") {
          return NextResponse.json({ error: 'No pending reschedule request' }, { status: 400 });
        }
        // Ensure proposed times are not null
        if (!booking.proposedStartTime || !booking.proposedEndTime) {
          return NextResponse.json({ error: 'Proposed times are missing' }, { status: 400 });
        }
        // Update booking times and clear reschedule fields
        const updated = await prisma.booking.update({
          where: { id },
          data: {
            startTime: booking.proposedStartTime,
            endTime: booking.proposedEndTime,
            proposedStartTime: { set: null },
            proposedEndTime: { set: null },
            rescheduleRequestedBy: { set: null },
            rescheduleStatus: "ACCEPTED",
          },
        });
        // Notify the other party
        const recipient = session.user.role === 'STUDENT' ? booking.teacherId : booking.studentId;
        const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
        if (recipientUser?.email) {
          await sendEmail({
            to: recipientUser.email,
            subject: 'Mentoro: Reschedule Accepted',
            text: `Your reschedule request has been accepted. The lesson will now take place at the proposed time.`
          });
        }
        // Create notification
        await prisma.notification.create({
          data: {
            userId: recipient,
            type: 'RESCHEDULE_ACCEPTED',
            message: 'Your reschedule request has been accepted.',
            link: `/bookings/${id}`,
          },
        });
        const fullBooking = await prisma.booking.findUnique({
          where: { id },
          include: {
            lesson: {
              include: {
                teacher: { select: { id: true, name: true, email: true, image: true } },
                course: { select: { id: true, title: true } },
              },
            },
            student: { select: { id: true, name: true, email: true, image: true } },
            teacher: { select: { id: true, name: true, email: true, image: true } },
            payment: true,
          },
        });
        return NextResponse.json(fullBooking);
      }
      if (action === "decline_reschedule") {
        // Only the other party can decline
        if (booking.rescheduleRequestedBy === session.user.role) {
          return NextResponse.json({ error: 'You cannot decline your own reschedule request' }, { status: 403 });
        }
        if (booking.rescheduleStatus !== "REQUESTED") {
          return NextResponse.json({ error: 'No pending reschedule request' }, { status: 400 });
        }
        // Clear reschedule fields
        const updated = await prisma.booking.update({
          where: { id },
          data: {
            proposedStartTime: { set: null },
            proposedEndTime: { set: null },
            rescheduleRequestedBy: { set: null },
            rescheduleStatus: "DECLINED",
          },
        });
        // Notify the other party
        const recipient = session.user.role === 'STUDENT' ? booking.teacherId : booking.studentId;
        const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
        if (recipientUser?.email) {
          await sendEmail({
            to: recipientUser.email,
            subject: 'Mentoro: Reschedule Declined',
            text: `Your reschedule request has been declined. Please contact the other party for further details.`
          });
        }
        // Create notification
        await prisma.notification.create({
          data: {
            userId: recipient,
            type: 'RESCHEDULE_DECLINED',
            message: 'Your reschedule request has been declined.',
            link: `/bookings/${id}`,
          },
        });
        const fullBooking = await prisma.booking.findUnique({
          where: { id },
          include: {
            lesson: {
              include: {
                teacher: { select: { id: true, name: true, email: true, image: true } },
                course: { select: { id: true, title: true } },
              },
            },
            student: { select: { id: true, name: true, email: true, image: true } },
            teacher: { select: { id: true, name: true, email: true, image: true } },
            payment: true,
          },
        });
        return NextResponse.json(fullBooking);
      }
      if (action === "cancel_reschedule") {
        // Only the requester can cancel
        if (booking.rescheduleRequestedBy !== session.user.role) {
          return NextResponse.json({ error: 'Only the requester can cancel the reschedule' }, { status: 403 });
        }
        if (booking.rescheduleStatus !== "REQUESTED") {
          return NextResponse.json({ error: 'No pending reschedule request' }, { status: 400 });
        }
        // Clear reschedule fields
        const updated = await prisma.booking.update({
          where: { id },
          data: {
            proposedStartTime: { set: null },
            proposedEndTime: { set: null },
            rescheduleRequestedBy: { set: null },
            rescheduleStatus: "CANCELLED",
          },
        });
        // Notify the other party
        const recipient = session.user.role === 'STUDENT' ? booking.teacherId : booking.studentId;
        const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
        if (recipientUser?.email) {
          await sendEmail({
            to: recipientUser.email,
            subject: 'Mentoro: Reschedule Cancelled',
            text: `The reschedule request has been cancelled. The original booking will remain unchanged.`
          });
        }
        // Create notification
        await prisma.notification.create({
          data: {
            userId: recipient,
            type: 'RESCHEDULE_CANCELLED',
            message: 'The reschedule request has been cancelled.',
            link: `/bookings/${id}`,
          },
        });
        const fullBooking = await prisma.booking.findUnique({
          where: { id },
          include: {
            lesson: {
              include: {
                teacher: { select: { id: true, name: true, email: true, image: true } },
                course: { select: { id: true, title: true } },
              },
            },
            student: { select: { id: true, name: true, email: true, image: true } },
            teacher: { select: { id: true, name: true, email: true, image: true } },
            payment: true,
          },
        });
        return NextResponse.json(fullBooking);
      }
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    // --- End rescheduling logic ---

    // ... existing status update logic ...
    const { status: bookingStatus } = body;
    if (!bookingStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    // Check if user has permission to update this booking
    if (existingBooking.studentId !== session.user.id && existingBooking.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    // Only teachers can confirm/cancel bookings, students can only cancel their own bookings
    if (session.user.role === 'STUDENT' && bookingStatus !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Students can only cancel bookings' },
        { status: 403 }
      );
    }
    // Only the teacher can confirm bookings
    if (bookingStatus === 'CONFIRMED' && existingBooking.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the teacher can confirm bookings' },
        { status: 403 }
      );
    }
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: bookingStatus },
      include: {
        lesson: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        payment: true,
      },
    });
    // Notify the other party
    const recipient = session.user.role === 'STUDENT' ? updatedBooking.teacherId : updatedBooking.studentId;
    const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
    if (recipientUser?.email) {
      await sendEmail({
        to: recipientUser.email,
        subject: 'Mentoro: Booking Status Changed',
        text: `The status of your lesson booking has been changed to ${bookingStatus}. Please check the app for more details.`
      });
    }
    // Create notification
    await prisma.notification.create({
      data: {
        userId: recipient,
        type: 'BOOKING_STATUS_CHANGED',
        message: `The status of your lesson booking has been changed to ${bookingStatus}.`,
        link: `/bookings/${id}`,
      },
    });
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to cancel this booking
    if (existingBooking.studentId !== session.user.id && existingBooking.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow cancellation of pending or confirmed bookings
    if (existingBooking.status !== 'PENDING' && existingBooking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed or already cancelled booking' },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Notify the other party
    const recipient = session.user.role === 'STUDENT' ? existingBooking.teacherId : existingBooking.studentId;
    const recipientUser = await prisma.user.findUnique({ where: { id: recipient } });
    if (recipientUser?.email) {
      await sendEmail({
        to: recipientUser.email,
        subject: 'Mentoro: Booking Cancelled',
        text: `The lesson booking has been cancelled. Please contact the other party for further details.`
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: recipient,
        type: 'BOOKING_CANCELLED',
        message: 'The lesson booking has been cancelled.',
        link: `/bookings/${id}`,
      },
    });

    return NextResponse.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
} 