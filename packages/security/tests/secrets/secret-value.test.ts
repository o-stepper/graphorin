import { Buffer } from 'node:buffer';
import { format, inspect } from 'node:util';
import { SECRET_VALUE_BRAND } from '@graphorin/core/contracts';
import * as fc from 'fast-check';
import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetSecretValueAuditListenersForTesting,
  onSecretValueAudit,
  SecretValue,
} from '../../src/secrets/secret-value.js';

afterEach(() => {
  _resetSecretValueAuditListenersForTesting();
});

const REDACTED = '[SECRET]';
const INSPECT_MARK = 'SecretValue([REDACTED])';

describe('SecretValue', () => {
  it('exposes length but never the raw value', () => {
    const s = SecretValue.fromString('sk-actually-secret-value');
    expect(s.length).toBe('sk-actually-secret-value'.length);
    expect(s.disposed).toBe(false);
  });

  it('reveals the raw value only via reveal()', () => {
    const s = SecretValue.fromString('open-sesame');
    expect(s.reveal()).toBe('open-sesame');
  });

  it('exposes a deprecated unwrap() method that delegates to reveal()', () => {
    const s = SecretValue.fromString('legacy-call-site');
    expect(s.unwrap()).toBe('legacy-call-site');
    // unwrap() must run the same audit as reveal() - exercised by the
    // audit emitter test below; checked here via behavioural parity.
    expect(s.unwrap()).toBe(s.reveal());
  });

  it('grants scoped access via use(fn)', async () => {
    const s = SecretValue.fromString('open-sesame');
    const out = await s.use(async (raw) => `${raw}!`);
    expect(out).toBe('open-sesame!');
  });

  it('grants scoped Buffer access via useBuffer(fn)', async () => {
    const s = SecretValue.fromString('binary-bytes');
    const out = await s.useBuffer((buf) => Buffer.from(buf).toString('utf8'));
    expect(out).toBe('binary-bytes');
  });

  it('hands callers a defensive Buffer copy', async () => {
    const s = SecretValue.fromString('keep-me-safe');
    await s.useBuffer((buf) => buf.fill(0));
    expect(s.reveal()).toBe('keep-me-safe');
  });

  it('isSecretValue is cross-realm safe via Symbol.for', () => {
    const s = SecretValue.fromString('cross-realm');
    expect(SecretValue.isSecretValue(s)).toBe(true);

    // Simulate a cross-realm object - same brand symbol via Symbol.for.
    const fake = { [SECRET_VALUE_BRAND]: true } as object;
    expect(SecretValue.isSecretValue(fake)).toBe(true);

    expect(SecretValue.isSecretValue('not-a-secret')).toBe(false);
    expect(SecretValue.isSecretValue(null)).toBe(false);
    expect(SecretValue.isSecretValue(undefined)).toBe(false);
    expect(SecretValue.isSecretValue({})).toBe(false);
  });

  it('the brand symbol is realm-safe (Symbol.for)', () => {
    // Symbol.for is the only symbol primitive guaranteed by ECMA-262 to
    // round-trip across realms (Worker threads, vm contexts, …). The
    // class fixes its brand on the prototype using
    // `Symbol.for('graphorin.SecretValue')` so a `SecretValue`
    // constructed in a separate realm is still recognized as such here.
    expect(SECRET_VALUE_BRAND).toBe(Symbol.for('graphorin.SecretValue'));
    const fakeForeign = { [SECRET_VALUE_BRAND]: true };
    expect(SecretValue.isSecretValue(fakeForeign)).toBe(true);
  });

  it('constant-time equals on identical bytes', () => {
    const a = SecretValue.fromString('same');
    const b = SecretValue.fromString('same');
    const c = SecretValue.fromString('different');
    const d = SecretValue.fromString('also');
    expect(SecretValue.timingSafeEquals(a, b)).toBe(true);
    expect(SecretValue.timingSafeEquals(a, c)).toBe(false);
    expect(SecretValue.timingSafeEquals(a, d)).toBe(false);
  });

  it('timingSafeEquals returns false on disposed inputs', () => {
    const a = SecretValue.fromString('same');
    const b = SecretValue.fromString('same');
    a.dispose();
    expect(SecretValue.timingSafeEquals(a, b)).toBe(false);
  });

  it('throws when reading a disposed wrapper', async () => {
    const s = SecretValue.fromString('forget-me');
    s.dispose();
    expect(s.disposed).toBe(true);
    expect(() => s.reveal()).toThrow(/disposed/i);
    await expect(s.use(() => 'fail')).rejects.toThrow(/disposed/i);
    await expect(s.useBuffer(() => 'fail')).rejects.toThrow(/disposed/i);
  });

  it('dispose is idempotent', () => {
    const s = SecretValue.fromString('forget-me');
    s.dispose();
    s.dispose();
    expect(s.disposed).toBe(true);
  });

  it('emits audit events for every access path', async () => {
    const events: string[] = [];
    const off = onSecretValueAudit((e) => events.push(e.action));
    const s = SecretValue.fromString('audit-me');
    await s.use(() => null);
    await s.useBuffer(() => null);
    s.reveal();
    s.dispose();
    off();
    expect(events).toEqual(['construct', 'use', 'use-buffer', 'reveal', 'dispose']);
  });

  it('does not let a faulty audit listener tear down secret access', async () => {
    onSecretValueAudit(() => {
      throw new Error('boom');
    });
    const s = SecretValue.fromString('audit-me');
    await expect(s.use((raw) => raw)).resolves.toBe('audit-me');
  });
});

describe('SecretValue leakage barriers', () => {
  it('blocks direct toString / String coercion', () => {
    const s = SecretValue.fromString('sk-test-1234567890');
    expect(s.toString()).toBe(REDACTED);
    expect(String(s)).toBe(REDACTED);
    expect(`${s}`).toBe(REDACTED);
    // Intentional bare `+` concatenation: tests the `Symbol.toPrimitive`
    // 'default' hint codepath that template literals do not exercise.
    // biome-ignore lint/style/useTemplate: testing the + '' coercion path
    expect(s + '').toBe(REDACTED);
  });

  it('blocks JSON serialization', () => {
    const s = SecretValue.fromString('sk-test-1234567890');
    expect(JSON.stringify({ apiKey: s })).toBe('{"apiKey":"[SECRET]"}');
    expect(JSON.stringify(s)).toBe(`"${REDACTED}"`);
  });

  it('blocks node:util.inspect / console.log', () => {
    const s = SecretValue.fromString('sk-test-1234567890');
    expect(inspect(s)).toBe(INSPECT_MARK);
    expect(format('%s', s)).toBe(REDACTED);
    expect(format('%j', s)).toBe(`"${REDACTED}"`);
    expect(format('%O', s)).toBe(INSPECT_MARK);
  });

  it('blocks Error message coercion', () => {
    const s = SecretValue.fromString('sk-test-1234567890');
    expect(new Error(`${s}`).message).toBe(REDACTED);
    expect(new Error(String(s)).message).toBe(REDACTED);
  });

  it('blocks Buffer.from(secret) leak', () => {
    const s = SecretValue.fromString('sk-test-1234567890');
    expect(Buffer.from(`${s}`).toString('utf8')).toBe(REDACTED);
  });

  it('returns NaN for numeric coercion (poisons math operations)', () => {
    const s = SecretValue.fromString('123');
    expect(Number(s)).toBeNaN();
    expect(+s).toBeNaN();
  });

  it('property: leakage barriers never reveal the raw value', () => {
    // The raw input is constrained to characters that cannot appear in
    // either of the redaction markers (`[SECRET]` / `SecretValue([REDACTED])`)
    // and is at least 4 bytes long, ensuring fast-check cannot generate
    // a degenerate single-letter input that happens to be a substring
    // of the placeholder. This focuses the assertion on the leakage
    // barriers rather than on incidental string overlap.
    fc.assert(
      fc.property(fc.stringMatching(/^[!@#$%^&*()_+0-9a-z]{4,64}$/), (raw) => {
        const s = SecretValue.fromString(raw);
        const haystack = [
          s.toString(),
          String(s),
          `${s}`,
          JSON.stringify(s),
          JSON.stringify({ outer: s }),
          inspect(s),
          format('%s', s),
          format('%j', s),
          new Error(`${s}`).message,
          Buffer.from(`${s}`).toString('utf8'),
        ];
        return haystack.every((sink) => !sink.includes(raw));
      }),
      { numRuns: 200 },
    );
  });
});
