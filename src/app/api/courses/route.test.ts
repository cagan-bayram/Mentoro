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
    course: { findMany: jest.fn() },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockFindMany = (prisma.course.findMany as unknown) as jest.Mock;

describe('Courses API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns courses for teacher', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1', role: 'TEACHER' } });
    const courses = [{ id: 'c1' }];
    mockFindMany.mockResolvedValue(courses);
    const res = await GET();
    const data = await res.json();
    expect(mockFindMany).toHaveBeenCalled();
    expect(data).toEqual(courses);
  });
});
