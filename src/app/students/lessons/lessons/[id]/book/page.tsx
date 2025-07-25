'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  isPublished: boolean;
  teacher: {
    id: string;
    name: string;
    email: string;
    image: string;
    bio: string;
    expertise: string[];
    hourlyRate: number;
  };
  course?: {
    id: string;
    title: string;
  };
}

export default function BookLessonPage({ params }: any) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string>('');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'STUDENT') {
      router.push('/dashboard');
      return;
    }

    const initializePage = async () => {
      try {
        const { id } = await params;
        setLessonId(id);
        await fetchLesson(id);
      } catch (err) {
        setError('Failed to load lesson');
        console.error('Error initializing page:', err);
        setLoading(false);
      }
    };

    initializePage();
  }, [session, status, router, params]);

  const fetchLesson = async (id: string) => {
    try {
      const response = await fetch(`/api/lessons/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }
      const data = await response.json();
      setLesson(data);
    } catch (err) {
      setError('Failed to load lesson');
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setError('');

    if (!formData.date || !formData.time) {
      setError('Please select both date and time');
      setBooking(false);
      return;
    }

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);
      const endTime = new Date(startTime.getTime() + lesson!.duration * 60 * 1000);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book lesson');
      }

      const bookingData = await response.json();
      router.push(`/students/bookings/bookings/${bookingData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book lesson');
      console.error('Error booking lesson:', err);
    } finally {
      setBooking(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate available dates (next 30 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Generate available time slots (9 AM to 9 PM, every hour)
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 21; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return times;
  };

  const handleBookLesson = () => {
    router.push(`/students/lessons/lessons/${lessonId}/book`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/students/lessons"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lesson not found</p>
          <Link
            href="/students/lessons"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson.isPublished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">This lesson is not available for booking</p>
          <Link
            href="/students/lessons"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/students/lessons/lessons/${lessonId}`}
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lesson
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Book Lesson</h1>
          <p className="mt-2 text-gray-600">Schedule your lesson with {lesson.teacher.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Lesson: </span>
              <span className="text-gray-900">{lesson.title}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Teacher: </span>
              <span className="text-gray-900">{lesson.teacher.name}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Duration: </span>
              <span className="text-gray-900">{lesson.duration} minutes</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Price: </span>
              <span className="text-gray-900 font-semibold">${lesson.price}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Date & Time</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <select
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a date</option>
                {getAvailableDates().map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a time</option>
                {getAvailableTimes().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Booking Summary</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Lesson:</strong> {lesson.title}</p>
                <p><strong>Teacher:</strong> {lesson.teacher.name}</p>
                <p><strong>Duration:</strong> {lesson.duration} minutes</p>
                <p><strong>Price:</strong> ${lesson.price}</p>
                {formData.date && formData.time && (
                  <>
                    <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {formData.time}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={booking}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
              <Link
                href={`/students/lessons/lessons/${lessonId}`}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 