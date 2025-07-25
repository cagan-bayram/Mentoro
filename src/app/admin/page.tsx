'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: role as any } : u))
    );
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="px-2 py-1 border">Name</th>
            <th className="px-2 py-1 border">Email</th>
            <th className="px-2 py-1 border">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-2 py-1">{user.name}</td>
              <td className="border px-2 py-1">{user.email}</td>
              <td className="border px-2 py-1">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  className="border rounded p-1"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
