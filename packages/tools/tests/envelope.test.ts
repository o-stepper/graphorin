import { toolReturn } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { splitTextAndContentParts, toResultEnvelope } from '../src/result/envelope.js';

describe('toResultEnvelope', () => {
  it('handles a raw string output', () => {
    const env = toResultEnvelope({ raw: 'plain' });
    expect(env.output).toBe('plain');
    expect(env.textBody).toBe('plain');
    expect(env.contentParts).toHaveLength(0);
  });

  it('handles a structured output', () => {
    const env = toResultEnvelope({ raw: { y: 1 } });
    expect(env.output).toEqual({ y: 1 });
    expect(env.textBody).toBe('{"y":1}');
  });

  it('handles a ToolReturn envelope with content parts', () => {
    const env = toResultEnvelope({
      raw: {
        output: { ok: true },
        contentParts: [{ type: 'text', text: 'side' }],
      },
    });
    expect(env.output).toEqual({ ok: true });
    expect(env.contentParts).toHaveLength(1);
  });

  it('assembles text chunks into the output', () => {
    const env = toResultEnvelope({
      raw: undefined,
      chunks: [
        { kind: 'text', text: 'a' },
        { kind: 'text', text: 'b' },
        { kind: 'text', text: 'c' },
      ],
    });
    expect(env.output).toBe('abc');
    expect(env.textBody).toBe('abc');
  });

  it('switches to array-and-join strategy after 4096 chars', () => {
    const longChunk = 'x'.repeat(5000);
    const env = toResultEnvelope({
      raw: undefined,
      chunks: [
        { kind: 'text', text: longChunk },
        { kind: 'text', text: 'tail' },
      ],
    });
    expect(env.output).toContain('xxxxx');
    expect(env.output).toContain('tail');
  });

  it('applies json-delta chunks via JSON Patch', () => {
    const env = toResultEnvelope({
      raw: undefined,
      chunks: [
        { kind: 'json-delta', path: '/a', value: 1 },
        { kind: 'json-delta', path: '/b/c', value: 'nested' },
      ],
    });
    expect(env.output).toEqual({ a: 1, b: { c: 'nested' } });
  });

  it('rejects json-delta paths that target the prototype chain', () => {
    const sentinelKey = `__pollution_sentinel_${Date.now()}`;
    expect((Object.prototype as Record<string, unknown>)[sentinelKey]).toBeUndefined();

    const env = toResultEnvelope({
      raw: undefined,
      chunks: [
        { kind: 'json-delta', path: '/safe', value: 1 },
        { kind: 'json-delta', path: `/__proto__/${sentinelKey}`, value: 'pwned' },
        { kind: 'json-delta', path: `/constructor/prototype/${sentinelKey}`, value: 'pwned' },
        { kind: 'json-delta', path: '/prototype/x', value: 'pwned' },
      ],
    });

    expect(env.output).toEqual({ safe: 1 });
    expect((Object.prototype as Record<string, unknown>)[sentinelKey]).toBeUndefined();
    expect(({} as Record<string, unknown>)[sentinelKey]).toBeUndefined();
  });

  it('appends image chunks to contentParts', () => {
    const env = toResultEnvelope({
      raw: undefined,
      chunks: [{ kind: 'image', data: new Uint8Array([1, 2, 3]), mediaType: 'image/png' }],
    });
    expect(env.contentParts).toHaveLength(1);
    expect(env.contentParts[0]?.type).toBe('image');
  });

  it('renders undefined output as empty body', () => {
    const env = toResultEnvelope({ raw: undefined });
    expect(env.textBody).toBe('');
    expect(env.output).toBeUndefined();
  });
});

describe('splitTextAndContentParts', () => {
  it('separates text and non-text parts', () => {
    const env = toResultEnvelope({
      raw: {
        output: 'main',
        contentParts: [
          { type: 'text', text: 'side' },
          { type: 'image', image: new Uint8Array([1]), mimeType: 'image/png' },
        ],
      },
    });
    const split = splitTextAndContentParts(env);
    expect(split.textParts).toHaveLength(1);
    expect(split.nonText).toHaveLength(1);
    expect(split.text).toBe('main');
  });
});

describe('W-115 - branded ToolReturn + narrowed structural sniff', () => {
  it('a process-style {output, exitCode, stderr} result is NOT unwrapped', () => {
    const raw = { output: 'compiled', exitCode: 0, stderr: '' };
    const env = toResultEnvelope({ raw });
    // The whole object reaches the model - no field is silently dropped.
    expect(env.output).toEqual(raw);
    expect(env.textBody).toContain('exitCode');
  });

  it('canonical unbranded literals still unwrap and bump the unbranded counter', () => {
    resetCountersForTesting();
    const withTaint = toResultEnvelope({ raw: { output: 'x', taint: { untrusted: true } } });
    expect(withTaint.output).toBe('x');
    expect(withTaint.taint?.untrusted).toBe(true);
    const withParts = toResultEnvelope({
      raw: { output: 'y', contentParts: [{ type: 'text', text: 'p' }] },
    });
    expect(withParts.output).toBe('y');
    expect(withParts.contentParts).toHaveLength(1);
    expect(getCounterForTesting('tool.result.envelope.unbranded-toolreturn.total', undefined)).toBe(
      2,
    );
  });

  it('a toolReturn() value unwraps by brand even with plain {output} shape', () => {
    resetCountersForTesting();
    const env = toResultEnvelope({ raw: toolReturn({ output: { nested: true } }) });
    expect(env.output).toEqual({ nested: true });
    expect(getCounterForTesting('tool.result.envelope.unbranded-toolreturn.total', undefined)).toBe(
      0,
    );
  });

  it('plain data of exactly {output: X} stays ambiguous-by-contract (still unwraps, counted)', () => {
    resetCountersForTesting();
    const env = toResultEnvelope({ raw: { output: 42 } });
    expect(env.output).toBe(42);
    expect(getCounterForTesting('tool.result.envelope.unbranded-toolreturn.total', undefined)).toBe(
      1,
    );
  });
});
