'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
}

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchBookings();
  }, [session, status, router, statusFilter]);

  const fetchBookings = async () => {
    try {
      const url = statusFilter 
        ? `/api/bookings?status=${statusFilter}`
        : '/api/bookings';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any }
          : booking
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      setBookings(bookings.filter(booking => booking.id !== bookingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setError('')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            {session?.user.role === 'STUDENT' 
              ? 'Manage your lesson bookings' 
              : 'Manage your teaching schedule'
            }
          </p>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === '' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'PENDING' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'CONFIRMED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'COMPLETED' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'CANCELLED' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {session?.user.role === 'STUDENT' 
                ? 'Start by booking your first lesson' 
                : 'Students will appear here when they book your lessons'
              }
            </p>
            {session?.user.role === 'STUDENT' && (
              <Link
                href="/lessons"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Lessons
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {booking.lesson.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="font-medium">${booking.price}</span>
                        <span className="mx-1">•</span>
                        <span>{booking.lesson.duration} min</span>
                        <span className="mx-1">•</span>
                        <span>{formatDateTime(booking.startTime)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {session?.user.role === 'STUDENT' ? 'Teacher:' : 'Student:'}
                      </span>
                      <div className="flex items-center mt-1">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                          {session?.user.role === 'STUDENT' ? (
                            booking.teacher.image ? (
                              <img
                                src={booking.teacher.image}
                                alt={booking.teacher.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">
                                {booking.teacher.name.charAt(0).toUpperCase()}
                              </span>
                            )
                          ) : (
                            booking.student.image ? (
                              <img
                                src={booking.student.image}
                                alt={booking.student.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">
                                {booking.student.name.charAt(0).toUpperCase()}
                              </span>
                            )
                          )}
                        </div>
                        <span className="text-sm text-gray-900">
                          {session?.user.role === 'STUDENT' 
                            ? booking.teacher.name 
                            : booking.student.name
                          }
                        </span>
                      </div>
                    </div>

                    {booking.lesson.course && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Course:</span>
                        <p className="text-sm text-gray-900">{booking.lesson.course.title}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </Link>
                    
                    {session?.user.role === 'TEACHER' && booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                          className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    
                    {session?.user.role === 'STUDENT' && 
                     (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 