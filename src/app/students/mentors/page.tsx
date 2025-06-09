"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Mentor {
  id: string;
  name: string;
  email: string;
  bio?: string;
  expertise: string[];
  hourlyRate?: number;
  image?: string;
}

export default function BrowseMentorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session.user?.role !== "STUDENT") {
      router.push("/dashboard"); // Redirect non-students
      return;
    }

    if (status === "authenticated" && session.user?.role === "STUDENT") {
      const fetchMentors = async () => {
        try {
          const response = await fetch("/api/mentors");
          if (!response.ok) {
            throw new Error("Failed to fetch mentors");
          }
          const data = await response.json();
          setMentors(data);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unexpected error occurred.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchMentors();
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">Loading mentors...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold text-red-600">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Browse Mentors</h1>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.length === 0 ? (
            <p className="text-gray-600">No mentors found at the moment.</p>
          ) : (
            mentors.map((mentor) => (
              <div key={mentor.id} className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-gray-900">{mentor.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">{mentor.bio || "No bio provided."}</p>
                  <p className="mt-4 text-sm font-medium text-gray-700">
                    Expertise: {mentor.expertise.length > 0 ? mentor.expertise.join(", ") : "N/A"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    Hourly Rate: {mentor.hourlyRate ? `$${mentor.hourlyRate.toFixed(2)}` : "Free"}
                  </p>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="flex justify-end">
                    <Link
                      href={`/students/mentors/${mentor.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 