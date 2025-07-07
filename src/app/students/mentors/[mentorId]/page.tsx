"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

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

interface MentorReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  student: { id: string; name: string; image?: string };
}

export default function MentorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const mentorId = typeof params.mentorId === 'string' ? params.mentorId : Array.isArray(params.mentorId) ? params.mentorId[0] : '';
  const { data: session, status } = useSession();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

    if (mentorId) {
      setReviewsLoading(true);
      fetch(`/api/reviews?teacherId=${mentorId}`)
        .then((res) => res.json())
        .then((data) => setReviews(data))
        .catch(() => setReviews([]))
        .finally(() => setReviewsLoading(false));
    }
  }, [mentorId, session, status, router]);

  const handleBookOrContact = () => {
    if (!mentor) return;
    if (mentor.lessons.length === 1) {
      toast.info(`Redirecting to the only lesson offered by ${mentor.name}`);
      router.push(`/students/lessons/lessons/${mentor.lessons[0].id}/book`);
    } else if (mentor.lessons.length > 1) {
      router.push(`/students/mentors/${mentorId}/lessons`);
    } else {
      toast.error("This mentor does not have any bookable lessons yet.");
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : null;

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

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Reviews
              {averageRating !== null && (
                <span className="flex items-center ml-2">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-base font-medium text-gray-700">{averageRating.toFixed(1)} / 5</span>
                  <span className="ml-2 text-sm text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </span>
              )}
            </h2>
            {reviewsLoading ? (
              <div className="text-gray-500 mt-2">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-gray-500 mt-2">No reviews yet.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {[1,2,3,4,5].map((star) => (
                        <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-700 font-medium">{review.student?.name || 'Student'}</span>
                      <span className="ml-2 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-800 mt-1">{review.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleBookOrContact}
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