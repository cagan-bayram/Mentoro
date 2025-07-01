import { cn } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });
}); 