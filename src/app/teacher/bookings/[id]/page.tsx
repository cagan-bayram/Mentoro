"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'react-hot-toast';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  price: number;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    description: string;
    duration: number;
    student: {
      id: string;
      name: string;
      email: string;
    };
    course?: {
      id: string;
      title: string;
    };
    teacher: {
      id: string;
      name: string;
      email: string;
      image: string;
    };
  };
  student: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  payment?: {
    status: "PENDING" | "PAID" | "FAILED";
    stripeSessionId?: string;
  };
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  rescheduleRequestedBy?: "STUDENT" | "TEACHER" | null;
  rescheduleStatus?: "NONE" | "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | null;
}

export default function TeacherBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchBooking();
  }, [session, status, router, params]);

  const fetchBooking = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch booking");
      }
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError("Failed to load booking");
      console.error("Error fetching booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update booking');
        throw new Error(errorData.error || 'Failed to update booking');
      }
      const updatedBooking = await response.json();
      setBooking(updatedBooking);
      toast.success('Booking updated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      toast.error(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    }
  };

  // Reschedule helpers
  const toInputDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };
  const toInputTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  const handleProposeReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const { id } = await params;
      if (!rescheduleDate || !rescheduleTime) {
        setRescheduleError("Please select both date and time");
        setRescheduleLoading(false);
        return;
      }
      const lessonDuration = booking?.lesson.duration || 60;
      const start = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const end = new Date(start.getTime() + lessonDuration * 60 * 1000);
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose_reschedule",
          proposedStartTime: start.toISOString(),
          proposedEndTime: end.toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to propose reschedule");
      setBooking(data);
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleTime("");
      toast.success('Reschedule proposed!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to propose reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };
  const handleAcceptReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept_reschedule" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to accept reschedule");
      setBooking(data);
      toast.success('Reschedule accepted!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to accept reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };
  const handleDeclineReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline_reschedule" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to decline reschedule");
      setBooking(data);
      toast.success('Reschedule declined!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to decline reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };
  const handleCancelReschedule = async () => {
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const { id } = await params;
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_reschedule" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cancel reschedule");
      setBooking(data);
      toast.success('Reschedule cancelled!');
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to cancel reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Booking not found"}</p>
          <Link
            href="/teacher/bookings"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Bookings
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
            href="/teacher/bookings"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bookings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="mt-2 text-gray-600">View and manage your lesson booking</p>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.lesson.title}</h2>
                <div className="flex items-center text-lg text-gray-600 mb-4">
                  <span className="font-semibold text-green-600">${booking.price}</span>
                  <span className="mx-2">•</span>
                  <span>{booking.lesson.duration} minutes</span>
                  <span className="mx-2">•</span>
                  <span>{formatDateTime(booking.startTime)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Lesson: </span>
                    <span className="text-gray-900">{booking.lesson.title}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description: </span>
                    <p className="text-gray-900 mt-1">{booking.lesson.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Duration: </span>
                    <span className="text-gray-900">{booking.lesson.duration} minutes</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Price: </span>
                    <span className="text-gray-900 font-semibold">${booking.price}</span>
                  </div>
                  {booking.lesson.course && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Course: </span>
                      <span className="text-gray-900">{booking.lesson.course.title}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Start Time: </span>
                    <span className="text-gray-900">{formatDateTime(booking.startTime)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">End Time: </span>
                    <span className="text-gray-900">{formatDateTime(booking.endTime)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Booked On: </span>
                    <span className="text-gray-900">{formatDateTime(booking.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t pt-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                    {booking.teacher.image ? (
                      <img src={booking.teacher.image} alt={booking.teacher.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{booking.teacher.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.teacher.name}</p>
                    <p className="text-sm text-gray-600">{booking.teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                    {booking.student.image ? (
                      <img src={booking.student.image} alt={booking.student.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{booking.student.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Student</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.student.name}</p>
                    <p className="text-sm text-gray-600">{booking.student.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t pt-6">
              <div className="flex space-x-4">
                {session?.user.role === "TEACHER" && booking.status === "PENDING" && (
                  <>
                    <button onClick={() => handleStatusUpdate("CONFIRMED")} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium">Confirm Booking</button>
                    <button onClick={() => handleStatusUpdate("CANCELLED")} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium">Decline Booking</button>
                  </>
                )}
                {session?.user.role === "TEACHER" && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                  <button onClick={() => {
                    setShowRescheduleModal(true);
                    setRescheduleDate(toInputDate(booking.startTime));
                    setRescheduleTime(toInputTime(booking.startTime));
                  }} className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600">Reschedule</button>
                )}
                {booking.status === "CONFIRMED" && (
                  <button onClick={() => handleStatusUpdate("COMPLETED")} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium">Mark as Completed</button>
                )}
              </div>
            </div>
            {/* Reschedule Section */}
            {booking && (booking.rescheduleStatus && booking.rescheduleStatus !== "NONE") && (
              <div className="mt-6 p-4 border rounded bg-yellow-50">
                <h4 className="font-semibold mb-2">Reschedule Request</h4>
                <div className="mb-2">
                  <span className="font-medium">Proposed Time: </span>
                  {booking.proposedStartTime && booking.proposedEndTime ? (
                    <span>{formatDateTime(booking.proposedStartTime)} - {formatDateTime(booking.proposedEndTime)}</span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Requested By: </span>
                  <span>{booking.rescheduleRequestedBy}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Status: </span>
                  <span>{booking.rescheduleStatus}</span>
                </div>
                {/* Actions for teacher */}
                {session?.user.role === "TEACHER" && booking.rescheduleStatus === "REQUESTED" && booking.rescheduleRequestedBy === "STUDENT" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleAcceptReschedule} disabled={rescheduleLoading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Accept</button>
                    <button onClick={handleDeclineReschedule} disabled={rescheduleLoading} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Decline</button>
                  </div>
                )}
                {session?.user.role === "TEACHER" && booking.rescheduleStatus === "REQUESTED" && booking.rescheduleRequestedBy === "TEACHER" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCancelReschedule} disabled={rescheduleLoading} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel Request</button>
                  </div>
                )}
                {rescheduleError && <div className="text-red-600 mt-2">{rescheduleError}</div>}
              </div>
            )}
            {/* Reschedule Modal */}
            {showRescheduleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
                  <button onClick={() => setShowRescheduleModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">&times;</button>
                  <h3 className="text-xl font-semibold mb-4">Propose New Time</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  {rescheduleError && <div className="text-red-600 mb-2">{rescheduleError}</div>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleProposeReschedule} disabled={rescheduleLoading} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Propose</button>
                    <button onClick={() => setShowRescheduleModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 