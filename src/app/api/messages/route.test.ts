/** @jest-environment node */
import { GET, POST } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '../../../lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../lib/auth', () => ({ authOptions: {} }));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockFindMany = (prisma.message.findMany as unknown) as jest.Mock;
const mockCreate = (prisma.message.create as unknown) as jest.Mock;

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated access', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns messages in chronological order', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
    const messages = [
      { id: '1', createdAt: '2020-01-01T00:00:00.000Z', content: 'a' },
      { id: '2', createdAt: '2020-01-02T00:00:00.000Z', content: 'b' },
    ];
    mockFindMany.mockResolvedValue(messages);
    const res = await GET();
    const data = await res.json();
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
    expect(data).toEqual(messages);
  });

  it('creates a new message', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
    const body = { content: 'hello' };
    const req = { json: jest.fn().mockResolvedValue(body) } as any;
    const created = { id: '3', content: 'hello', createdAt: '2025-07-25T14:00:10.595Z' };
    mockCreate.mockResolvedValue(created);
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { content: 'hello', senderId: '1' },
    });
    expect(data).toEqual(created);
  });
});
