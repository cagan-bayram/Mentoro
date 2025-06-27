"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  };
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TeacherBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user.role !== "TEACHER") {
      router.push("/dashboard");
      return;
    }
    fetchBookings();
  }, [session, status, router, statusFilter]);

  const fetchBookings = async () => {
    try {
      const url = statusFilter
        ? `/api/bookings?status=${statusFilter}`
        : "/api/bookings";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError("Failed to load bookings");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update booking");
      }
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: newStatus as any }
          : booking
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
      console.error("Error updating booking:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
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
            onClick={() => setError("")}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">Manage your lesson bookings with students</p>
        </div>
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === "" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("CONFIRMED")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === "CONFIRMED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === "COMPLETED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Completed
          </button>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">You have no bookings with students yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-lg font-semibold text-gray-900">{booking.lesson.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : booking.status === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : booking.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>{booking.status}</span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">Student: {booking.student.name} ({booking.student.email})</div>
                  <div className="text-sm text-gray-700 mb-1">Start: {new Date(booking.startTime).toLocaleString()}</div>
                  <div className="text-sm text-gray-700 mb-1">End: {new Date(booking.endTime).toLocaleString()}</div>
                  <div className="text-sm text-gray-700 mb-1">Price: ${booking.price}</div>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  {booking.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                        className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                      className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 