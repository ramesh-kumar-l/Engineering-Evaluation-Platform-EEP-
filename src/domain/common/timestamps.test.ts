import { describe, expect, it } from 'vitest';
import { isoTimestampSchema } from './timestamps.js';

describe('isoTimestampSchema', () => {
  it('accepts a UTC ISO timestamp', () => {
    expect(isoTimestampSchema.parse('2026-09-13T10:00:00Z')).toBe('2026-09-13T10:00:00Z');
  });

  it('accepts an offset ISO timestamp', () => {
    expect(isoTimestampSchema.parse('2026-09-13T10:00:00.123+05:30')).toBe(
      '2026-09-13T10:00:00.123+05:30',
    );
  });

  it('rejects a timestamp without a timezone', () => {
    expect(() => isoTimestampSchema.parse('2026-09-13T10:00:00')).toThrow();
  });
});
