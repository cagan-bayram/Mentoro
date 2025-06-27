'use client';

import { useState, useEffect } from 'react';

interface AnalyticsProps {
  bookings: any[];
  lessons?: any[];
  userRole: 'TEACHER' | 'STUDENT';
}

export default function Analytics({ bookings, lessons = [], userRole }: AnalyticsProps) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalEarnings: 0,
    totalSpent: 0,
    averageRating: 0,
    lessonsCreated: 0,
    lessonsBooked: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [bookings, lessons, userRole]);

  const calculateStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === thisYear;
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;

    let totalEarnings = 0;
    let totalSpent = 0;

    if (userRole === 'TEACHER') {
      totalEarnings = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.price, 0);
    } else {
      totalSpent = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.price, 0);
    }

    const lessonsCreated = lessons.length;
    const lessonsBooked = userRole === 'STUDENT' ? totalBookings : 0;

    setStats({
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalEarnings,
      totalSpent,
      averageRating: 0, // Will be implemented with reviews
      lessonsCreated,
      lessonsBooked,
    });
  };

  const getStatusPercentage = (status: string) => {
    if (stats.totalBookings === 0) return 0;
    const count = bookings.filter(b => b.status === status).length;
    return Math.round((count / stats.totalBookings) * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {userRole === 'TEACHER' ? 'Total Earnings' : 'Total Spent'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userRole === 'TEACHER' 
                  ? formatCurrency(stats.totalEarnings)
                  : formatCurrency(stats.totalSpent)
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${getStatusPercentage('COMPLETED')}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{getStatusPercentage('COMPLETED')}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${getStatusPercentage('PENDING')}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{getStatusPercentage('PENDING')}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Cancelled</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${getStatusPercentage('CANCELLED')}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{getStatusPercentage('CANCELLED')}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userRole === 'TEACHER' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons Created</span>
                <span className="font-semibold">{stats.lessonsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Students</span>
                <span className="font-semibold">
                  {new Set(bookings.map(b => b.student.id)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">
                  {stats.totalBookings > 0 
                    ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {userRole === 'STUDENT' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons Booked</span>
                <span className="font-semibold">{stats.lessonsBooked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teachers Worked With</span>
                <span className="font-semibold">
                  {new Set(bookings.map(b => b.teacher.id)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Lesson Price</span>
                <span className="font-semibold">
                  {stats.completedBookings > 0 
                    ? formatCurrency(stats.totalSpent / stats.completedBookings)
                    : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map(booking => (
              <div key={booking.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.lesson.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.startTime).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 