"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const bookingSchema = z.object({
  lessonId: z.string().min(1, "Lesson is required"),
  requestedDate: z.string().min(1, "Date is required"),
  requestedTime: z.string().min(1, "Time is required"),
  message: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

export default function CreateBookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const watchedLessonId = watch("lessonId");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }

    fetchAvailableLessons();
  }, [session, status, router]);

  useEffect(() => {
    if (watchedLessonId) {
      const lesson = lessons.find((l) => l.id === watchedLessonId);
      setSelectedLesson(lesson || null);
    }
  }, [watchedLessonId, lessons]);

  const fetchAvailableLessons = async () => {
    try {
      const response = await fetch("/api/lessons?isPublished=true");
      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }
      const data = await response.json();
      setLessons(data);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast.error("Failed to load available lessons");
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const booking = await response.json();
      toast.success("Booking request sent successfully!");
      router.push("/students/bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking request");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Book a Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="lessonId">Select Lesson</Label>
                <select
                  id="lessonId"
                  {...register("lessonId")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a lesson...</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} - ${lesson.price} ({lesson.duration} min)
                    </option>
                  ))}
                </select>
                {errors.lessonId && (
                  <p className="text-red-500 text-sm mt-1">{errors.lessonId.message}</p>
                )}
              </div>

              {selectedLesson && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Selected Lesson:</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Title:</strong> {selectedLesson.title}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Teacher:</strong> {selectedLesson.teacher.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Price:</strong> ${selectedLesson.price}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Duration:</strong> {selectedLesson.duration} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong> {selectedLesson.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requestedDate">Preferred Date</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    {...register("requestedDate")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.requestedDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.requestedDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="requestedTime">Preferred Time</Label>
                  <Input
                    id="requestedTime"
                    type="time"
                    {...register("requestedTime")}
                  />
                  {errors.requestedTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.requestedTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message to Teacher (Optional)</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder="Tell the teacher about your goals or any specific topics you'd like to cover..."
                  rows={4}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending Request..." : "Send Booking Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/students/mentors")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 