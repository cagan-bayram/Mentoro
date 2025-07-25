/** @jest-environment node */
import { GET } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '../../../lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../lib/auth', () => ({ authOptions: {} }));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    booking: { findMany: jest.fn() },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockFindMany = (prisma.booking.findMany as unknown) as jest.Mock;

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
});
