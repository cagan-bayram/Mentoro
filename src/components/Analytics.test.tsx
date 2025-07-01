import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Analytics from './Analytics';

describe('Analytics', () => {
  it('renders without crashing', () => {
    render(
      <Analytics bookings={[]} lessons={[]} userRole="TEACHER" />
    );
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
  });
}); 