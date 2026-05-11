import { describe, expect, it } from 'vitest';

import { canonicalJson, fingerprintRequest, sha256Hex } from '../src/internal/json.js';

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
