import { describe, it, expect } from 'vitest';
import { clientDeriveDate, decadeLabel, confidenceLabel } from '../format';
import { pickColor, AVATAR_COLORS, initials } from '../tones';

describe('clientDeriveDate', () => {
  it('formats a year', () => {
    expect(clientDeriveDate('1962', 'year').label).toBe('1962');
  });
  it('formats an exact date', () => {
    expect(clientDeriveDate('1962-06-14', 'exact').label).toBe('June 14, 1962');
  });
  it('keeps approximate text', () => {
    const d = clientDeriveDate('Early 1960s', 'approx');
    expect(d.confidence).toBe('approx');
    expect(d.label).toBe('Early 1960s');
  });
  it('treats empty as unknown', () => {
    expect(clientDeriveDate('', 'year').confidence).toBe('unknown');
  });
});

describe('helpers', () => {
  it('labels decades', () => { expect(decadeLabel(1960)).toBe('1960s'); });
  it('labels confidence', () => { expect(confidenceLabel('approx')).toBe('Approximate'); });
  it('derives initials', () => { expect(initials('Grandma Jean')).toBe('GJ'); });
  it('pickColor is deterministic', () => {
    expect(pickColor(AVATAR_COLORS, 'Sarah')).toBe(pickColor(AVATAR_COLORS, 'Sarah'));
  });
});
