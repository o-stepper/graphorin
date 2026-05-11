import { describe, expect, it } from 'vitest';

import { normalizeScore, parseIntegerResponse } from '../src/reranker.js';

describe('parseIntegerResponse', () => {
  it('parses bare integers', () => {
    expect(parseIntegerResponse('7')).toBe(7);
    expect(parseIntegerResponse('0')).toBe(0);
    expect(parseIntegerResponse('100')).toBe(100);
  });

  it('strips surrounding whitespace', () => {
    expect(parseIntegerResponse(' 7 ')).toBe(7);
    expect(parseIntegerResponse('7\n')).toBe(7);
  });

  it("extracts the first integer in 'Score: 7' / '7/10' style replies", () => {
    expect(parseIntegerResponse('Score: 7')).toBe(7);
    expect(parseIntegerResponse('7/10')).toBe(7);
    expect(parseIntegerResponse('The answer is 5 out of 10')).toBe(5);
  });

  it('returns null for empty / non-numeric replies', () => {
    expect(parseIntegerResponse('')).toBeNull();
    expect(parseIntegerResponse('   ')).toBeNull();
    expect(parseIntegerResponse('I cannot tell')).toBeNull();
  });

  it('rejects negative bare integers (the model is contractually 0..maxScore)', () => {
    expect(parseIntegerResponse('-3')).toBeNull();
  });
});

describe('normalizeScore', () => {
  it('normalises into [0, 1] given a positive maxScore', () => {
    expect(normalizeScore(7, 10, 0)).toBeCloseTo(0.7);
    expect(normalizeScore(0, 10, 0)).toBe(0);
    expect(normalizeScore(10, 10, 0)).toBe(1);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeScore(-5, 10, 0)).toBe(0);
    expect(normalizeScore(15, 10, 0)).toBe(1);
  });

  it('returns the fallback when the input is null / undefined / NaN', () => {
    expect(normalizeScore(null, 10, 0.42)).toBe(0.42);
    expect(normalizeScore(undefined, 10, 0.42)).toBe(0.42);
    expect(normalizeScore(Number.NaN, 10, 0.42)).toBe(0.42);
  });
});
