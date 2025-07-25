jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));
import { prisma } from './prisma';

describe('prisma', () => {
  it('should be defined', () => {
    expect(prisma).toBeDefined();
  });
}); 