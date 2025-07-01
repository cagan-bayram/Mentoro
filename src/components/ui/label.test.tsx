import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders without crashing', () => {
    render(<Label>Label text</Label>);
  });
}); 