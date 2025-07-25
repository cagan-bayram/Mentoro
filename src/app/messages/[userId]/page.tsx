'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const recipientId = params.userId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchMessages();
  }, [session, status, router]);

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?recipientId=${recipientId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, content: text }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setText('');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="border p-2 mb-4 h-80 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <span className="text-sm text-gray-600">
              {new Date(m.createdAt).toLocaleTimeString()} -{' '}
              {m.senderId === session?.user.id ? 'You' : 'Them'}:
            </span>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border flex-1 p-1"
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4">
          Send
        </button>
      </div>
    </div>
  );
}
