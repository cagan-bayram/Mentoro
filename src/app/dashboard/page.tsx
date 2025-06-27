"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Analytics from "@/components/Analytics";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  price: number;
  lesson: {
    id: string;
    title: string;
    teacher: {
      id: string;
      name: string;
    };
  };
  student: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  price: number;
  duration: number;
  isPublished: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      // Fetch bookings
      const bookingsResponse = await fetch('/api/bookings');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }

      // Fetch lessons (for teachers)
      if (session?.user.role === 'TEACHER') {
        const lessonsResponse = await fetch('/api/lessons');
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            You are signed in as a{" "}
            <span className="font-semibold capitalize">
              {session.user.role?.toLowerCase()}
            </span>
          </p>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <Analytics 
            bookings={bookings} 
            lessons={lessons}
            userRole={session.user.role as 'TEACHER' | 'STUDENT'}
          />
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-white p-6 shadow">
          {session.user.role === "STUDENT" ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Browse Lessons</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Discover and book lessons from expert teachers.
                  </p>
                  <Link
                    href="/students/lessons"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Browse Lessons
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">My Bookings</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    View and manage your lesson bookings.
                  </p>
                  <Link
                    href="/students/bookings"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    View Bookings
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Calendar</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    View your lesson schedule and upcoming bookings.
                  </p>
                  <Link
                    href="/calendar"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    View Calendar
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Find Mentors</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Browse available mentors to start learning.
                  </p>
                  <Link
                    href="/students/mentors"
                    className="inline-block bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
                  >
                    Browse Mentors
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">My Courses</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Create and manage your courses.
                  </p>
                  <Link
                    href="/teacher/courses"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Manage Courses
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">My Lessons</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Create and manage individual lessons.
                  </p>
                  <Link
                    href="/teacher/lessons"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Manage Lessons
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Calendar</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    View your teaching schedule and upcoming bookings.
                  </p>
                  <Link
                    href="/calendar"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    View Calendar
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Bookings</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    View and manage student bookings.
                  </p>
                  <Link
                    href="/teacher/bookings"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    View Bookings
                  </Link>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/teacher/courses/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Course
                  </Link>
                  <Link
                    href="/teacher/lessons/create"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create New Lesson
                  </Link>
                  <Link
                    href="/teacher/profile"
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 