"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  description: string;
  price?: number;
  duration: number;
}

export default function MentorLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = typeof params.mentorId === 'string' ? params.mentorId : Array.isArray(params.mentorId) ? params.mentorId[0] : '';
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mentorName, setMentorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const response = await fetch(`/api/mentors/${mentorId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch mentor profile");
        }
        const data = await response.json();
        setLessons(data.lessons || []);
        setMentorName(data.name || "");
      } catch (err) {
        setError("Failed to load mentor lessons");
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [mentorId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">Loading lessons...</h2>
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lessons by {mentorName}</h1>
          <Link href={`/students/mentors/${mentorId}`} className="text-blue-600 hover:text-blue-700">Back to Mentor Profile</Link>
        </div>
        {lessons.length === 0 ? (
          <p className="text-gray-600">This mentor does not have any bookable lessons yet.</p>
        ) : (
          <div className="grid gap-6">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-lg border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{lesson.title}</h2>
                  <p className="mt-1 text-gray-700">{lesson.description}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">{lesson.price ? `$${lesson.price.toFixed(2)}` : "Free"}</p>
                  <p className="mt-1 text-sm text-gray-600">Duration: {lesson.duration} minutes</p>
                </div>
                <button
                  onClick={() => router.push(`/students/lessons/lessons/${lesson.id}/book`)}
                  className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-medium"
                >
                  Book Lesson
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 