import { describe, it, expect } from 'vitest';
import { deriveDate, pickColor, AVATAR_COLORS } from '../lib/util';

describe('deriveDate', () => {
  it('formats an exact date', () => {
    const d = deriveDate('1962-06-14', 'exact');
    expect(d.label).toBe('June 14, 1962');
    expect(d.sort).toBe('1962-06-14');
    expect(d.year).toBe(1962);
  });

  it('formats a month + year', () => {
    const d = deriveDate('1962-06', 'month-year');
    expect(d.label).toBe('June 1962');
    expect(d.year).toBe(1962);
  });

  it('formats a year only', () => {
    const d = deriveDate('1962', 'year');
    expect(d.label).toBe('1962');
    expect(d.sort).toBe('1962-01-01');
  });

  it('keeps approximate free text and derives a sort year', () => {
    const d = deriveDate('Early 1960s', 'approx', 'Early 1960s');
    expect(d.confidence).toBe('approx');
    expect(d.label).toBe('Early 1960s');
    expect(d.year).toBe(1960);
  });

  it('returns unknown for empty input', () => {
    const d = deriveDate('', 'unknown');
    expect(d.confidence).toBe('unknown');
    expect(d.value).toBeNull();
    expect(d.label).toBeNull();
  });
});

describe('pickColor', () => {
  it('is deterministic for the same seed', () => {
    expect(pickColor(AVATAR_COLORS, 'Sarah')).toBe(pickColor(AVATAR_COLORS, 'Sarah'));
  });
});
