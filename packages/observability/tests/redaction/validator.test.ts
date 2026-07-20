import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_PATTERNS,
  createRedactionValidator,
  RedactionValidationError,
} from '../../src/redaction/index.js';

describe('@graphorin/observability/redaction - validator', () => {
  it('drops values whose declared tier exceeds the floor', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    const out = v.validate({ value: 'hello', tier: 'internal' });
    expect(out).toBeNull();
    expect(v.counters().droppedTotal).toBe(1);
    expect(v.counters().droppedByReason['sensitivity-tier-exceeded']).toBe(1);
  });

  it('passes through values within the floor unchanged', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    const out = v.validate({ value: 'hello world', tier: 'public' });
    expect(out).not.toBeNull();
    expect(out?.value).toBe('hello world');
  });

  it('masks default-on PII patterns and counts the matches', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    const result = v.validate({ value: 'email me at alice@example.com', tier: 'public' });
    expect(result).not.toBeNull();
    expect(result?.value).toContain('[REDACTED email]');
    expect(result?.value).not.toContain('alice@example.com');
    expect(v.counters().matchesByPattern.email).toBeGreaterThan(0);
  });

  it('RP-21: redacts a Luhn-valid PAN but leaves a 13-digit epoch timestamp alone', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    // A real Visa test number (Luhn-valid) is redacted.
    const pan = v.validate({ value: 'card 4111 1111 1111 1111', tier: 'public' });
    expect(pan?.value).toContain('[REDACTED creditcard]');
    // A 13-digit millisecond epoch is not a valid PAN (Luhn fails) - pre-RP-21
    // the regex masked it, corrupting the payload.
    const ts = v.validate({ value: 'ts=1718000000000', tier: 'public' });
    expect(ts?.value).toBe('ts=1718000000000');
  });

  it('leaves serialized numbers intact (decimal boundary + network prefix)', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    // A float's fractional digits are never a PAN, even when Luhn-valid.
    const score = v.validate({ value: '{"score":0.01639344262295082}', tier: 'public' });
    expect(score?.value).toBe('{"score":0.01639344262295082}');
    const luhnValidFraction = v.validate({ value: '{"p":0.4111111111111111}', tier: 'public' });
    expect(luhnValidFraction?.value).toBe('{"p":0.4111111111111111}');
    // Luhn-valid snowflake-style id: leading digit 1 is outside the
    // major-network prefixes, so it is not treated as a card.
    const id = v.validate({ value: 'id=1240000000000000001', tier: 'public' });
    expect(id?.value).toBe('id=1240000000000000001');
  });

  it('masks a raw numeric PAN leaf with a quoted mask so the JSON stays valid', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    const out = v.validate({ value: '{"card":4111111111111111}', tier: 'public' });
    expect(out?.value).toBe('{"card":"[REDACTED creditcard]"}');
    expect(JSON.parse(out?.value as string)).toEqual({ card: '[REDACTED creditcard]' });
  });

  it('masks a signed numeric PAN leaf, absorbing the sign (deep-retest 0.13.5 P2)', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    const out = v.validate({ value: '{"card":-4111111111111111}', tier: 'public' });
    expect(out?.value).toBe('{"card":"[REDACTED creditcard]"}');
    expect(JSON.parse(out?.value as string)).toEqual({ card: '[REDACTED creditcard]' });
  });

  it('keeps JSON valid across whitespace / array / mixed-verify signed cases', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    const M = '[REDACTED creditcard]';
    const cases: ReadonlyArray<[string, unknown]> = [
      ['[-4111111111111111,2]', [M, 2]],
      ['{"card": -4111111111111111 }', { card: M }],
      ['-4111111111111111', M],
      // The Luhn-invalid neighbour stays a byte-identical number while the
      // valid PAN is masked - mixed accept/reject in one document.
      ['{"ok":4111111111111111,"num":4111111111111112}', { ok: M, num: 4111111111111112 }],
      // Two accepted matches, one signed, in one document.
      ['{"a":-4111111111111111,"b":5500000000000004}', { a: M, b: M }],
    ];
    for (const [input, expected] of cases) {
      const out = v.validate({ value: input, tier: 'public' });
      expect(JSON.parse(String(out?.value))).toEqual(expected);
    }
  });

  it('keeps the prose minus when the match is not in a JSON value position', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    const out = v.validate({ value: 'refund -4111111111111111 issued', tier: 'public' });
    expect(out?.value).toBe('refund -[REDACTED creditcard] issued');
  });

  it('property: a valid JSON document stays valid after redaction (seeded corpus)', () => {
    // Deterministic LCG (same recipe as the provider corpus test) so the
    // documents are stable across runs.
    let seed = 0x2f6e2b1;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    // Luhn-valid test PANs with major-network leads; all below 2^53 so the
    // numeric leaves round-trip exactly through JSON.stringify.
    const PANS = [4111111111111111, 5500000000000004, 340000000000009, 6011000000000004];
    const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)] as T;
    const genLeaf = (): unknown => {
      const r = next();
      if (r < 0.2) return pick(PANS) * (next() < 0.5 ? -1 : 1);
      if (r < 0.35) return `card ${pick(PANS)} on file`;
      if (r < 0.5) return next() * 1000;
      if (r < 0.6) return 1700000000000 + Math.floor(next() * 1e10);
      if (r < 0.7) return next() < 0.5;
      if (r < 0.8) return null;
      return 'plain text';
    };
    const genValue = (depth: number): unknown => {
      if (depth >= 2 || next() < 0.3) return genLeaf();
      if (next() < 0.5) {
        return Array.from({ length: 1 + Math.floor(next() * 3) }, () => genValue(depth + 1));
      }
      const obj: Record<string, unknown> = {};
      const n = 1 + Math.floor(next() * 3);
      for (let i = 0; i < n; i += 1) obj[`k${i}`] = genValue(depth + 1);
      return obj;
    };
    const v = createRedactionValidator({ minTier: 'public' });
    for (let i = 0; i < 200; i += 1) {
      const doc = JSON.stringify(genValue(0), null, next() < 0.5 ? 0 : 2);
      const out = v.validate({ value: doc, tier: 'public' });
      const text = String(out?.value);
      expect(() => JSON.parse(text)).not.toThrow();
      expect(text).not.toMatch(
        /4111111111111111|5500000000000004|340000000000009|6011000000000004/,
      );
    }
  });

  it('throws when failOnUnredactedSensitive is true and a tier exceeds the floor', () => {
    const v = createRedactionValidator({ minTier: 'public', failOnUnredactedSensitive: true });
    expect(() => v.validate({ value: 'x', tier: 'secret' })).toThrow(RedactionValidationError);
  });

  it('throws when failOnUnredactedSensitive is true and a secret pattern fires', () => {
    const v = createRedactionValidator({
      minTier: 'internal',
      failOnUnredactedSensitive: true,
    });
    expect(() =>
      v.validate({ value: 'token=sk-1234567890abcdef1234567890', tier: 'public' }),
    ).toThrow(RedactionValidationError);
  });

  it('honours enabledPatterns as an allow-list', () => {
    const v = createRedactionValidator({
      minTier: 'internal',
      enabledPatterns: ['email'],
    });
    const out = v.validate({
      value: 'sk-12345678901234567890 alice@example.com',
      tier: 'public',
    });
    const text = String(out?.value);
    expect(text).not.toContain('alice@example.com');
    expect(text).toContain('[REDACTED email]');
    expect(text).toContain('sk-12345678901234567890');
  });

  it('OBS-PRIC-02: enabledPatterns can enable an opt-in pattern (ipv4)', () => {
    // ipv4 is opt-in (off by default) - the allow-list must reach it.
    const v = createRedactionValidator({
      minTier: 'internal',
      enabledPatterns: ['ipv4'],
    });
    const out = v.validate({ value: 'peer at 10.1.2.3 talked', tier: 'public' });
    expect(String(out?.value)).toContain('[REDACTED ipv4]');
  });

  it('OBS-PRIC-02: an opt-in pattern stays off by default (no enabledPatterns)', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    const out = v.validate({ value: 'peer at 10.1.2.3 talked', tier: 'public' });
    // Default-on catalogue excludes ipv4, so the address passes through.
    expect(String(out?.value)).toContain('10.1.2.3');
  });

  it('honours disabledPatterns as a deny-list', () => {
    const v = createRedactionValidator({
      minTier: 'internal',
      disabledPatterns: ['email'],
    });
    const out = v.validate({
      value: 'alice@example.com sk-12345678901234567890',
      tier: 'public',
    });
    const text = String(out?.value);
    expect(text).toContain('alice@example.com');
    expect(text).toContain('[REDACTED openai-key]');
  });

  it('walks nested objects and arrays', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    const out = v.validate({
      value: { nested: ['alice@example.com', { deeper: 'sk-12345678901234567890' }] },
      tier: 'public',
    });
    const value = out?.value as { nested: [string, { deeper: string }] };
    expect(value.nested[0]).toContain('[REDACTED email]');
    expect(value.nested[1].deeper).toContain('[REDACTED openai-key]');
  });

  it('breaks cycles with [Circular]', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    const out = v.validate({ value: obj, tier: 'public' });
    const value = out?.value as { self: unknown };
    expect(value.self).toBe('[Circular]');
  });

  it('counters reset cleanly', () => {
    const v = createRedactionValidator({ minTier: 'public' });
    v.validate({ value: 'x', tier: 'internal' });
    expect(v.counters().droppedTotal).toBe(1);
    v.resetCounters();
    expect(v.counters().droppedTotal).toBe(0);
  });

  it('property-based: random PII never survives a default-tier validator', () => {
    const v = createRedactionValidator({ minTier: 'internal' });
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('alice@example.com'),
          fc.constant('+14155551212'),
          fc.constant('123-45-6789'),
          fc.constant('sk-1234567890abcdefABCD1234'),
          fc.constant('Authorization: Bearer abcdef1234567890abcdef'),
        ),
        fc.constantFrom('payload: ', 'log: ', 'context: '),
        (pii: string, prefix: string) => {
          const result = v.validate({ value: `${prefix}${pii}`, tier: 'public' });
          if (result === null) return true;
          const text = String(result.value);
          return !text.includes(pii);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('exposes 14 built-in patterns by default', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(14);
  });

  it('supports a custom validator hook', () => {
    const v = createRedactionValidator({
      minTier: 'internal',
      customValidator: () => null,
    });
    expect(v.validate({ value: 'safe', tier: 'public' })).toBeNull();
  });
});
