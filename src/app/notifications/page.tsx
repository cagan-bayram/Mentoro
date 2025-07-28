"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchNotifications();
  }, [session, status, router]);

  const fetchNotifications = async (loadMore = false) => {
    if (loadMore) setFetchingMore(true);
    try {
      const url = cursor && loadMore
        ? `/api/notifications?limit=20&cursor=${cursor}`
        : "/api/notifications?limit=20";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: Notification[] = await res.json();
      setNotifications(prev => loadMore ? [...prev, ...data] : data);
      if (data.length < 20) setHasMore(false);
      const last = data[data.length - 1];
      if (last) setCursor(last.id);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      if (loadMore) setFetchingMore(false);
    }
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => { setError(""); setLoading(true); fetchNotifications(); }}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        {notifications.length === 0 ? (
          <p className="text-gray-600">No notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded border ${notif.read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  {!notif.read && (
                    <Button size="sm" variant="outline" onClick={() => markAsRead(notif.id)}>Mark as read</Button>
                  )}
                </div>
                {notif.link && (
                  <Link href={notif.link} className="text-blue-600 underline text-sm block mt-2">View</Link>
                )}
              </div>
            ))}
            {hasMore && (
              <div className="text-center">
                <Button disabled={fetchingMore} onClick={() => fetchNotifications(true)}>
                  {fetchingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

