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
