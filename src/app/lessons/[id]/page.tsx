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
  createdAt: string;
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

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchLesson();
  }, [session, status, router, params.id]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${params.id}`);
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

  const handleBookLesson = () => {
    router.push(`/lessons/${params.id}/book`);
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

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Lesson not found'}</p>
          <Link
            href="/lessons"
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/lessons"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lessons
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
                <div className="flex items-center text-lg text-gray-600 mb-4">
                  <span className="font-semibold text-green-600">${lesson.price}</span>
                  <span className="mx-2">•</span>
                  <span>{lesson.duration} minutes</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  lesson.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {lesson.isPublished ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{lesson.description}</p>
            </div>

            {lesson.course && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Part of Course</h3>
                <p className="text-blue-800">{lesson.course.title}</p>
              </div>
            )}

            <div className="border-t pt-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Teacher</h2>
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                  {lesson.teacher.image ? (
                    <img
                      src={lesson.teacher.image}
                      alt={lesson.teacher.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-600">
                      {lesson.teacher.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.teacher.name}</h3>
                  <p className="text-gray-600 mb-3">{lesson.teacher.bio}</p>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Hourly Rate: </span>
                    <span className="text-sm text-gray-600">${lesson.teacher.hourlyRate}/hour</span>
                  </div>
                  {lesson.teacher.expertise && lesson.teacher.expertise.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Expertise: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {lesson.teacher.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex space-x-4">
                <button
                  onClick={handleBookLesson}
                  disabled={!lesson.isPublished}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {lesson.isPublished ? 'Book This Lesson' : 'Lesson Not Available'}
                </button>
                <Link
                  href={`/mentors/${lesson.teacher.id}`}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center font-medium"
                >
                  View Teacher Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 