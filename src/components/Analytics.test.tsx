import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Analytics from './Analytics';

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
) as jest.Mock;

describe('Analytics', () => {
  it('renders without crashing', () => {
    render(
      <Analytics bookings={[]} lessons={[]} userRole="TEACHER" userId="1" />
    );
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
  });
}); 