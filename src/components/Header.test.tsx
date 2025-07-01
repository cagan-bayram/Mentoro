import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    role: 'STUDENT',
    image: null,
  },
  expires: '1',
};

describe('Header', () => {
  it('renders Mentoro brand when user is logged in', () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });
    render(<Header />);
    expect(screen.getByText('Mentoro')).toBeInTheDocument();
  });

  it('renders nothing when user is not logged in', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });
}); 