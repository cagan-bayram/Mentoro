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
  course?: {
    id: string;
    title: string;
  };
}

export default function TeacherLessonsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'TEACHER') {
      router.push('/dashboard');
      return;
    }

    fetchLessons();
  }, [session, status, router]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/lessons?teacherId=${session?.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const data = await response.json();
      setLessons(data);
    } catch (err) {
      setError('Failed to load lessons');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lesson');
      }

      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
      console.error('Error deleting lesson:', err);
    }
  };

  const handleTogglePublish = async (lessonId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lesson');
      }

      setLessons(lessons.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, isPublished: !currentStatus }
          : lesson
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
      console.error('Error updating lesson:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setError('')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Lessons</h1>
            <p className="mt-2 text-gray-600">Manage your lesson offerings</p>
          </div>
          <Link
            href="/teacher/lessons/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Lesson
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first lesson</p>
            <Link
              href="/teacher/lessons/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Lesson
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {lesson.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lesson.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {lesson.description}
                  </p>
                  
                  {lesson.course && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-500">Course:</span>
                      <p className="text-sm font-medium text-gray-700">{lesson.course.title}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">${lesson.price}</span>
                      <span className="mx-1">•</span>
                      <span>{lesson.duration} min</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/teacher/lessons/${lesson.id}/edit`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(lesson.id, lesson.isPublished)}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        lesson.isPublished
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {lesson.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 