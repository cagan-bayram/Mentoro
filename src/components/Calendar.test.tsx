import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Calendar from './Calendar';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

describe('Calendar', () => {
  it('renders without crashing', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    });
    render(<Calendar bookings={[]} />);
  });
});