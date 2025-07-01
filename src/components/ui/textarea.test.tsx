import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders without crashing', () => {
    render(<Textarea />);
  });
}); 