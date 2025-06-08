"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
                  <h3 className="font-medium">Enrolled Courses</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You haven't enrolled in any courses yet.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Upcoming Lessons</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    No upcoming lessons scheduled.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Recommended Mentors</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Browse available mentors to start learning.
                  </p>
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
                  <h3 className="font-medium">Your Courses</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You haven't created any courses yet.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Upcoming Sessions</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    No upcoming teaching sessions scheduled.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Student Requests</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    No pending student requests.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 