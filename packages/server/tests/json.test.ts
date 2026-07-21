import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  fingerprintRequest,
  INVALID_JSON_BODY,
  readJsonBody,
  sha256Hex,
} from '../src/internal/json.js';

describe('canonicalJson', () => {
  it('sorts object keys recursively', () => {
    const a = canonicalJson({ b: 1, a: { y: 2, x: 1 } });
    const b = canonicalJson({ a: { x: 1, y: 2 }, b: 1 });
    expect(a).toBe(b);
  });

  it('preserves array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles primitives', () => {
    expect(canonicalJson('hello')).toBe('"hello"');
    expect(canonicalJson(42)).toBe('42');
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(true)).toBe('true');
  });
});

describe('fingerprintRequest', () => {
  it('produces equal hashes for semantically-equal bodies', () => {
    const a = fingerprintRequest('POST', '/v1/foo', { a: 1, b: 2 });
    const b = fingerprintRequest('POST', '/v1/foo', { b: 2, a: 1 });
    expect(a).toBe(b);
  });

  it('produces different hashes when the body changes', () => {
    const a = fingerprintRequest('POST', '/v1/foo', { x: 1 });
    const b = fingerprintRequest('POST', '/v1/foo', { x: 2 });
    expect(a).not.toBe(b);
  });

  it('includes the method + path in the hash', () => {
    const a = fingerprintRequest('POST', '/v1/foo', {});
    const b = fingerprintRequest('PUT', '/v1/foo', {});
    expect(a).not.toBe(b);
    const c = fingerprintRequest('POST', '/v1/bar', {});
    expect(a).not.toBe(c);
  });

  it('sha256Hex returns the lowercase hex digest', () => {
    expect(sha256Hex('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('readJsonBody (deep-retest-0.13.10 P1)', () => {
  function ctx(text: string | (() => Promise<string>)): {
    readonly req: { readonly text: () => Promise<string> };
  } {
    return {
      req: { text: typeof text === 'string' ? async () => text : text },
    };
  }

  it('parses a valid JSON object', async () => {
    await expect(readJsonBody(ctx('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it('treats an EMPTY body as {} (bodiless POST convenience)', async () => {
    await expect(readJsonBody(ctx(''))).resolves.toEqual({});
    await expect(readJsonBody(ctx('  \n\t '))).resolves.toEqual({});
  });

  it('returns the sentinel for truncated JSON', async () => {
    await expect(readJsonBody(ctx('{"input":'))).resolves.toBe(INVALID_JSON_BODY);
  });

  it('returns the sentinel for non-JSON text', async () => {
    await expect(readJsonBody(ctx('hello world'))).resolves.toBe(INVALID_JSON_BODY);
  });

  it('passes through valid non-object JSON for the schema layer to reject', async () => {
    await expect(readJsonBody(ctx('null'))).resolves.toBeNull();
    await expect(readJsonBody(ctx('42'))).resolves.toBe(42);
  });

  it('returns the sentinel when the body stream itself fails', async () => {
    await expect(
      readJsonBody(
        ctx(async () => {
          throw new Error('stream broken');
        }),
      ),
    ).resolves.toBe(INVALID_JSON_BODY);
  });
});
