'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifClick = async () => {
    setIsNotifOpen((open) => !open);
    if (!isNotifOpen) {
      await fetchNotifications();
    }
  };

  const handleNotifItemClick = async (id: string, link: string | null) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev: any) => prev.map((n: any) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (link) router.push(link);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  if (!session) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Mentoro</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            {session.user.role === 'STUDENT' ? (
              <>
                <Link
                  href="/students/lessons"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Browse Lessons
                </Link>
                <Link
                  href="/students/bookings"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Bookings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/teacher/lessons"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Lessons
                </Link>
                <Link
                  href="/teacher/reviews"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Reviews
                </Link>
              </>
            )}
            {session.user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Admin
              </Link>
            )}
            <Link
              href="/onboarding"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Getting Started
            </Link>
            <Link
              href="/calendar"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Calendar
            </Link>
          </nav>

          {/* Notification Bell */}
          <div className="relative mr-4">
            <button
              onClick={handleNotifClick}
              className="relative p-2 rounded-full text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-50 border max-h-96 overflow-y-auto">
                <div className="px-4 py-2 font-semibold text-gray-700 border-b">Notifications</div>
                {notifLoading ? (
                  <div className="px-4 py-4 text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-4 text-gray-500">No notifications</div>
                ) : (
                  <>
                    {notifications.map((notif: any) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifItemClick(notif.id, notif.link)}
                        className={`block w-full text-left px-4 py-3 text-sm ${notif.read ? 'text-gray-500' : 'text-gray-900 font-medium bg-blue-50'} hover:bg-blue-100`}
                      >
                        {notif.message}
                        <span className="block text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</span>
                      </button>
                    ))}
                    <Link
                      href="/notifications"
                      className="block text-center text-sm text-blue-600 py-2 border-t hover:bg-blue-50"
                      onClick={() => setIsNotifOpen(false)}
                    >
                      View all
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {session.user.name}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-gray-500 capitalize">{session.user.role?.toLowerCase()}</div>
                  </div>
                  <Link
                    href={session.user.role === 'TEACHER' ? '/teacher/profile' : '/students/profile'}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden ml-4 p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {session.user.role === 'STUDENT' ? (
                <>
                  <Link
                    href="/students/lessons"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Browse Lessons
                  </Link>
                  <Link
                    href="/students/bookings"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/teacher/lessons"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Lessons
                  </Link>
                  <Link
                    href="/teacher/reviews"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Reviews
                  </Link>
                </>
              )}
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/onboarding"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Getting Started
              </Link>
              <Link
                href="/calendar"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Calendar
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 