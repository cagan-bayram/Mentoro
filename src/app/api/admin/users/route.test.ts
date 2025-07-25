/** @jest-environment node */
import { GET } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '../../../../lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../../lib/auth', () => ({ authOptions: {} }));

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockFindMany = (prisma.user.findMany as unknown) as jest.Mock;

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for non-admin user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'STUDENT' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns user list for admin', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN', id: '1' } });
    const users = [{ id: '1' }, { id: '2' }];
    mockFindMany.mockResolvedValue(users);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalled();
    expect(data).toEqual(users);
  });
});
