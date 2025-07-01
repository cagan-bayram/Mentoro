import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Card } from './card';

describe('Card', () => {
  it('renders without crashing', () => {
    render(<Card>Card content</Card>);
  });
}); 