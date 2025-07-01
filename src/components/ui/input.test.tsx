import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input />);
  });
}); 