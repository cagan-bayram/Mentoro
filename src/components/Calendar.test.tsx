import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Calendar from './Calendar';

describe('Calendar', () => {
  it('renders without crashing', () => {
    render(<Calendar bookings={[]} />);
  });
}); 