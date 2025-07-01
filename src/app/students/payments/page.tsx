"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  booking: {
    id: string;
    lesson: {
      title: string;
    };
    startTime: string;
    endTime: string;
  };
}

export default function StudentPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    fetchPayments();
  }, [session, status, router]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError("Failed to load payments");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PAID":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => setError("")}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="mt-2 text-gray-600">View all your lesson payments and receipts</p>
          </div>
          <Link href="/students/bookings">
            <Button variant="outline">Back to Bookings</Button>
          </Link>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600 mb-6">You have not made any payments yet.</p>
            <Link href="/students/bookings">
              <Button>Book a Lesson</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{payment.booking.lesson.title}</CardTitle>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>{payment.status}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Amount</span>
                      <span className="ml-2 font-medium">${payment.amount} {payment.currency.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Date</span>
                      <span className="ml-2">{formatDate(payment.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Booking</span>
                      <Link href={`/students/bookings/bookings/${payment.booking.id}`} className="ml-2 text-blue-600 underline">
                        View Booking
                      </Link>
                    </div>
                    {payment.status === "PAID" && payment.stripeSessionId && (
                      <div>
                        <span className="text-sm text-gray-600">Receipt</span>
                        <a
                          href={`https://dashboard.stripe.com/payments/${payment.stripeSessionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 underline"
                        >
                          View Stripe Receipt
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 