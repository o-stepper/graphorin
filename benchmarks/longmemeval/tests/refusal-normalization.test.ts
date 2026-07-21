/**
 * deep-retest-0.13.10 P1: the deterministic abstention scorer failed
 * a CORRECT refusal because the model wrote a typographic apostrophe
 * ("I don’t have that information.") while the regex only knew
 * ASCII `'` - the live full-context report showed 2/3 where the
 * actual result was 3/3. These tests pin the normalization layer.
 */

import { describe, expect, it } from 'vitest';

import { normalizeForRefusalMatch } from '../src/runner.js';

const REFUSAL =
  /\b(no information|don'?t have|do not have|not (mentioned|available|sure|provided)|can'?t|cannot|unknown|no record)\b/i;

function refused(answer: string): boolean {
  return REFUSAL.test(normalizeForRefusalMatch(answer));
}

describe('normalizeForRefusalMatch (deep-retest-0.13.10 P1)', () => {
  it('maps typographic apostrophes to ASCII', () => {
    expect(normalizeForRefusalMatch('don’t')).toBe("don't");
    expect(normalizeForRefusalMatch('don‘t')).toBe("don't");
    expect(normalizeForRefusalMatch('donʼt')).toBe("don't");
  });

  it('maps curly double quotes and no-break spaces', () => {
    expect(normalizeForRefusalMatch('“quoted”')).toBe('"quoted"');
    expect(normalizeForRefusalMatch('no record')).toBe('no record');
  });

  it('leaves ASCII text untouched', () => {
    const s = `I don't have that information.`;
    expect(normalizeForRefusalMatch(s)).toBe(s);
  });

  it('the exact live miss now scores as a refusal', () => {
    expect(refused('I don’t have that information.')).toBe(true);
  });

  it('typographic variants of every refusal phrase family match', () => {
    expect(refused('I can’t answer that.')).toBe(true);
    expect(refused('There is no record of that purchase.')).toBe(true);
    expect(refused('“Unknown” is the honest answer.')).toBe(true);
  });

  it('non-refusals still fail', () => {
    expect(refused('The meeting was on Tuesday.')).toBe(false);
    expect(refused('It cost $40.')).toBe(false);
  });
});
