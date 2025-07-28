/** @jest-environment node */
import { GET, POST } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rateLimit';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../lib/auth', () => ({ authOptions: {} }));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    booking: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    lesson: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock('../../../lib/rateLimit', () => ({
  rateLimit: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockFindMany = (prisma.booking.findMany as unknown) as jest.Mock;
const mockFindFirst = (prisma.booking.findFirst as unknown) as jest.Mock;
const mockCreate = (prisma.booking.create as unknown) as jest.Mock;
const mockLessonFind = (prisma.lesson.findUnique as unknown) as jest.Mock;
const mockUserFind = (prisma.user.findUnique as unknown) as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;

describe('Bookings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/bookings'));
    expect(res.status).toBe(401);
  });

  it('returns bookings for authenticated student', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1', role: 'STUDENT' } });
    const bookings = [{ id: 'b1' }, { id: 'b2' }];
    mockFindMany.mockResolvedValue(bookings);
    const res = await GET(new Request('http://localhost/api/bookings'));
    const data = await res.json();
    expect(mockFindMany).toHaveBeenCalled();
    expect(data).toEqual(bookings);
  });

  it('validates POST body', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1', role: 'STUDENT' } });
    mockUserFind.mockResolvedValue({ role: 'STUDENT' });
    const req = { json: jest.fn().mockResolvedValue({}) } as any;
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('applies rate limiting', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1', role: 'STUDENT' } });
    mockUserFind.mockResolvedValue({ role: 'STUDENT' });
    mockLessonFind.mockResolvedValue({ id: 'l1', isPublished: true, teacherId: 't1', teacher: { hourlyRate: 50 } });
    mockFindFirst.mockResolvedValue(null);
    mockRateLimit.mockReturnValue(false);
    const req = { json: jest.fn().mockResolvedValue({ lessonId: 'l1', startTime: '2025-01-01T10:00:00.000Z', endTime: '2025-01-01T11:00:00.000Z' }) } as any;
    const res = await POST(req as any);
    expect(res.status).toBe(429);
  });
});
