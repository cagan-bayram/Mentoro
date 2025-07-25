'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ReviewForm from '@/components/ReviewForm';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  price: number;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    description: string;
    duration: number;
    teacher: {
      id: string;
      name: string;
      email: string;
      image: string;
    };
    course?: {
      id: string;
      title: string;
    };
  };
  student: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  payment?: {
    status: 'PENDING' | 'PAID' | 'FAILED';
    stripeSessionId?: string;
  };
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  rescheduleRequestedBy?: 'STUDENT' | 'TEACHER' | null;
  rescheduleStatus?: 'NONE' | 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | null;
}

export default function BookingDetailPage({ params }: any) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchBooking();
  }, [session, status, router, params]);

  useEffect(() => {
    if (booking && booking.status === 'COMPLETED' && session?.user?.id) {
      setReviewLoading(true);
      fetch(`/api/reviews?bookingId=${booking.id}`)
        .then(res => res.json())
        .then(data => setReview(data && data.length > 0 ? data[0] : null))
        .catch(() => setReview(null))
        .finally(() => setReviewLoading(false));
    }
  }, [booking, session]);

  const fetchBooking = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError('Failed to load booking');
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update booking');
        throw new Error(errorData.error || 'Failed to update booking');
      }
      const updatedBooking = await response.json();
      setBooking(updatedBooking);
      toast.success('Booking updated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      toast.error(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to cancel booking');
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      toast.success('Booking cancelled');
      router.push('/students/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setPayError('');
    try {
      const { id } = await params;
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      toast.success('Redirecting to payment...');
      window.location.href = data.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
      toast.error(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toInputDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const toInputTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  const handleProposeReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      const { id } = await params;
      if (!rescheduleDate || !rescheduleTime) {
        setRescheduleError('Please select both date and time');
        setRescheduleLoading(false);
        return;
      }
      const lessonDuration = booking?.lesson.duration || 60;
      const start = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const end = new Date(start.getTime() + lessonDuration * 60 * 1000);
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'propose_reschedule',
          proposedStartTime: start.toISOString(),
          proposedEndTime: end.toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to propose reschedule');
      setBooking(data);
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      toast.success('Reschedule proposed!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Failed to propose reschedule');
      toast.error(err instanceof Error ? err.message : 'Failed to propose reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleAcceptReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_reschedule' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to accept reschedule');
      setBooking(data);
      toast.success('Reschedule accepted!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Failed to accept reschedule');
      toast.error(err instanceof Error ? err.message : 'Failed to accept reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleDeclineReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline_reschedule' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to decline reschedule');
      setBooking(data);
      toast.success('Reschedule declined!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Failed to decline reschedule');
      toast.error(err instanceof Error ? err.message : 'Failed to decline reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_reschedule' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel reschedule');
      setBooking(data);
      toast.success('Reschedule cancelled!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Failed to cancel reschedule');
      toast.error(err instanceof Error ? err.message : 'Failed to cancel reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Link
            href="/students/bookings"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/students/bookings"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bookings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="mt-2 text-gray-600">View your lesson booking information</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.lesson.title}</h2>
                <div className="flex items-center text-lg text-gray-600 mb-4">
                  <span className="font-semibold text-green-600">${booking.price}</span>
                  <span className="mx-2">•</span>
                  <span>{booking.lesson.duration} minutes</span>
                  <span className="mx-2">•</span>
                  <span>{formatDateTime(booking.startTime)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Lesson: </span>
                    <span className="text-gray-900">{booking.lesson.title}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description: </span>
                    <p className="text-gray-900 mt-1">{booking.lesson.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Duration: </span>
                    <span className="text-gray-900">{booking.lesson.duration} minutes</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Price: </span>
                    <span className="text-gray-900 font-semibold">${booking.price}</span>
                  </div>
                  {booking.lesson.course && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Course: </span>
                      <span className="text-gray-900">{booking.lesson.course.title}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Start Time: </span>
                    <span className="text-gray-900">{formatDateTime(booking.startTime)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">End Time: </span>
                    <span className="text-gray-900">{formatDateTime(booking.endTime)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Booked On: </span>
                    <span className="text-gray-900">{formatDateTime(booking.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                    {booking.teacher.image ? (
                      <img
                        src={booking.teacher.image}
                        alt={booking.teacher.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {booking.teacher.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.teacher.name}</p>
                    <p className="text-sm text-gray-600">{booking.teacher.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                    {booking.student.image ? (
                      <img
                        src={booking.student.image}
                        alt={booking.student.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {booking.student.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Student</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.student.name}</p>
                    <p className="text-sm text-gray-600">{booking.student.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex space-x-4">
                {session?.user.role === 'TEACHER' && booking.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
                    >
                      Decline Booking
                    </button>
                  </>
                )}
                
                {session?.user.role === 'STUDENT' && 
                 (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                  <button
                    onClick={handleCancelBooking}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
                  >
                    Cancel Booking
                  </button>
                )}
                
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
                  >
                    Mark as Completed
                  </button>
                )}

                {session?.user.role === 'STUDENT' &&
                  (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
                  !booking.payment && (
                    <button
                      onClick={handlePay}
                      disabled={paying}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium"
                    >
                      {paying ? 'Redirecting...' : 'Pay for Lesson'}
                    </button>
                  )}
                {payError && (
                  <span className="text-red-600 ml-4 self-center">{payError}</span>
                )}
              </div>
            </div>

            {booking.payment && (
              <div className="mt-4">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.payment.status)}`}>Payment: {booking.payment.status}</span>
                {booking.payment.status === 'PAID' && booking.payment.stripeSessionId && (
                  <a
                    href={`https://dashboard.stripe.com/payments/${booking.payment.stripeSessionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-blue-600 underline"
                  >
                    View Stripe Receipt
                  </a>
                )}
              </div>
            )}

            {booking && (booking.rescheduleStatus && booking.rescheduleStatus !== 'NONE') && (
              <div className="mt-6 p-4 border rounded bg-yellow-50">
                <h4 className="font-semibold mb-2">Reschedule Request</h4>
                <div className="mb-2">
                  <span className="font-medium">Proposed Time: </span>
                  {booking.proposedStartTime && booking.proposedEndTime ? (
                    <span>{formatDateTime(booking.proposedStartTime)} - {formatDateTime(booking.proposedEndTime)}</span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Requested By: </span>
                  <span>{booking.rescheduleRequestedBy}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Status: </span>
                  <span>{booking.rescheduleStatus}</span>
                </div>
                {session?.user.role === 'STUDENT' && booking.rescheduleStatus === 'REQUESTED' && booking.rescheduleRequestedBy === 'TEACHER' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleAcceptReschedule} disabled={rescheduleLoading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Accept</button>
                    <button onClick={handleDeclineReschedule} disabled={rescheduleLoading} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Decline</button>
                  </div>
                )}
                {session?.user.role === 'STUDENT' && booking.rescheduleStatus === 'REQUESTED' && booking.rescheduleRequestedBy === 'STUDENT' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCancelReschedule} disabled={rescheduleLoading} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel Request</button>
                  </div>
                )}
                {rescheduleError && <div className="text-red-600 mt-2">{rescheduleError}</div>}
              </div>
            )}

            {booking && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (!booking.rescheduleStatus || booking.rescheduleStatus === 'NONE' || booking.rescheduleStatus === 'DECLINED' || booking.rescheduleStatus === 'CANCELLED') && session?.user.role === 'STUDENT' && (
              <div className="mt-6">
                <button onClick={() => {
                  setShowRescheduleModal(true);
                  setRescheduleDate(toInputDate(booking.startTime));
                  setRescheduleTime(toInputTime(booking.startTime));
                }} className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600">Reschedule</button>
              </div>
            )}

            {showRescheduleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
                  <button onClick={() => setShowRescheduleModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">&times;</button>
                  <h3 className="text-xl font-semibold mb-4">Propose New Time</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  {rescheduleError && <div className="text-red-600 mb-2">{rescheduleError}</div>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleProposeReschedule} disabled={rescheduleLoading} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Propose</button>
                    <button onClick={() => setShowRescheduleModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {booking && booking.status === 'COMPLETED' && session?.user?.role === 'STUDENT' && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Review</h3>
                {reviewLoading ? (
                  <div className="text-gray-500">Loading review...</div>
                ) : review ? (
                  <div className="bg-gray-50 rounded p-4">
                    <div className="flex items-center mb-2">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-gray-800 mb-1">{review.comment}</div>
                    <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString()}</div>
                  </div>
                ) : showReviewForm ? (
                  <ReviewForm
                    bookingId={booking.id}
                    teacherId={booking.teacher.id}
                    lessonTitle={booking.lesson.title}
                    teacherName={booking.teacher.name}
                    onSubmit={() => {
                      setShowReviewForm(false);
                      setReviewLoading(true);
                      fetch(`/api/reviews?bookingId=${booking.id}`)
                        .then(res => res.json())
                        .then(data => setReview(data && data.length > 0 ? data[0] : null))
                        .finally(() => setReviewLoading(false));
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Leave a Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 