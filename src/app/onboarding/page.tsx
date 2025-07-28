"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Mentoro</h1>
      <p className="mb-4 text-gray-700">
        Mentoro connects students with experienced mentors for one-on-one
        lessons. Follow these steps to get started.
      </p>
      <ol className="list-decimal list-inside space-y-2 mb-6">
        <li>Create an account and choose whether you want to learn or teach.</li>
        <li>Browse available lessons and book a time that works for you.</li>
        <li>Pay securely via Stripe and join the lesson at the scheduled time.</li>
        <li>After the lesson, leave a review for your mentor.</li>
      </ol>
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
