import { describe, it, expect } from 'vitest';
import { cn, formatFileSize } from '../utils';

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignores falsy values', () => {
    expect(cn('a', undefined, false, null, 'b')).toBe('a b');
  });

  it('deduplicates conflicting tailwind utilities (last wins)', () => {
    // tailwind-merge keeps the last of two conflicting utilities
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns empty string when no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatFileSize', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('respects the decimals parameter', () => {
    expect(formatFileSize(1536, 1)).toBe('1.5 KB');
  });

  it('defaults to 0 bytes when argument is omitted', () => {
    expect(formatFileSize()).toBe('0 Bytes');
  });
});
