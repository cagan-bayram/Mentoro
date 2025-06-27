'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  lesson: {
    id: string;
    title: string;
    teacher: {
      name: string;
    };
  };
  student: {
    name: string;
  };
}

interface CalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  viewMode?: 'month' | 'week';
}

export default function Calendar({ bookings, onDateClick, viewMode = 'month' }: CalendarProps) {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-24 bg-gray-50 rounded-lg"></div>;
          }

          const dayBookings = getBookingsForDate(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDate = isToday(day);
          const isSelectedDate = isSelected(day);

          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                h-24 p-1 border rounded-lg cursor-pointer transition-colors
                ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${isSelectedDate ? 'border-blue-600 bg-blue-100' : ''}
                ${!isCurrentMonthDay ? 'text-gray-400' : 'text-gray-900'}
                hover:bg-gray-50
              `}
            >
              <div className="text-sm font-medium mb-1">
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map(booking => (
                  <div
                    key={booking.id}
                    className={`
                      text-xs px-1 py-0.5 rounded border truncate
                      ${getStatusColor(booking.status)}
                    `}
                    title={`${booking.lesson.title} - ${formatTime(booking.startTime)}`}
                  >
                    {formatTime(booking.startTime)} {booking.lesson.title.substring(0, 8)}...
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          {getBookingsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getBookingsForDate(selectedDate).map(booking => (
                <div
                  key={booking.id}
                  className={`
                    p-3 rounded-lg border
                    ${getStatusColor(booking.status)}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{booking.lesson.title}</div>
                      <div className="text-sm">
                        {session?.user.role === 'TEACHER' 
                          ? `Student: ${booking.student.name}`
                          : `Teacher: ${booking.lesson.teacher.name}`
                        }
                      </div>
                      <div className="text-sm">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                    </div>
                    <span className="text-xs font-medium uppercase">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No bookings for this date</p>
          )}
        </div>
      )}
    </div>
  );
} 