jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

const { authOptions } = require('./auth');

describe('authOptions', () => {
  it('should be defined', () => {
    expect(authOptions).toBeDefined();
  });
}); 