"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  price?: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  price?: number;
  duration: number;
}

interface MentorProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  education?: string;
  experience?: string;
  expertise: string[];
  hourlyRate?: number;
  image?: string;
  courses: Course[];
  lessons: Lesson[];
}

export default function MentorProfilePage({ params }: { params: { mentorId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { mentorId } = params;

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
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
      const fetchMentor = async () => {
        try {
          const response = await fetch(`/api/mentors/${mentorId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch mentor profile");
          }
          const data: MentorProfile = await response.json();
          setMentor(data);
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

      fetchMentor();
    }
  }, [mentorId, session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">Loading mentor profile...</h2>
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

  if (!mentor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">Mentor not found.</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center space-x-6">
            {mentor.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mentor.image}
                alt={`${mentor.name}'s profile`}
                className="h-24 w-24 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>
              <p className="mt-1 text-lg text-gray-600">{mentor.email}</p>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {mentor.hourlyRate ? `$${mentor.hourlyRate.toFixed(2)}/hour` : "Free Lessons"}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">About Me</h2>
            <p className="mt-2 text-gray-700">{mentor.bio || "No bio provided."}</p>
          </div>

          {(mentor.education || mentor.experience) && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Background</h2>
              {mentor.education && (
                <p className="mt-2 text-gray-700">Education: {mentor.education}</p>
              )}
              {mentor.experience && (
                <p className="mt-2 text-gray-700">Experience: {mentor.experience}</p>
              )}
            </div>
          )}

          {mentor.expertise.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Areas of Expertise</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {mentor.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mentor.courses.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Courses Offered</h2>
              <div className="mt-4 grid gap-4">
                {mentor.courses.map((course) => (
                  <div key={course.id} className="rounded-lg border bg-gray-50 p-4 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{course.description}</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {course.price ? `$${course.price.toFixed(2)}` : "Free"}
                    </p>
                    <Link href={`/courses/${course.id}`} className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      View Course
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mentor.lessons.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Individual Lessons</h2>
              <div className="mt-4 grid gap-4">
                {mentor.lessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-lg border bg-gray-50 p-4 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{lesson.description}</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {lesson.price ? `$${lesson.price.toFixed(2)}` : "Free"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">Duration: {lesson.duration} minutes</p>
                    <Link href={`/lessons/${lesson.id}`} className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      View Lesson
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              // This button will eventually lead to booking a lesson or contacting the mentor
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Contact {mentor.name} / Book a Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 