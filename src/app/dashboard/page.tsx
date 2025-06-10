"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            You are signed in as a{" "}
            <span className="font-semibold capitalize">
              {session.user.role?.toLowerCase()}
            </span>
          </p>

          {session.user.role === "STUDENT" ? (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Learning Dashboard
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Browse Lessons</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Discover and book lessons from expert teachers.
                  </p>
                  <Link
                    href="/lessons"
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
                    href="/bookings"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    View Bookings
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Find Mentors</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    Browse available mentors to start learning.
                  </p>
                  <Link
                    href="/mentors"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    Browse Mentors
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Teaching Dashboard
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <h3 className="font-medium">Bookings</h3>
                  <p className="mt-2 text-sm text-gray-600 mb-3">
                    View and manage student bookings.
                  </p>
                  <Link
                    href="/bookings"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
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