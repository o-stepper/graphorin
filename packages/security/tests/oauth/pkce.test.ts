import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  base64Url,
  computePkceChallenge,
  generatePkceVerifier,
  generateState,
} from '../../src/oauth/pkce.js';

describe('@graphorin/security/oauth — PKCE primitives', () => {
  it('produces verifiers within the spec-mandated character range', () => {
    for (let i = 0; i < 20; i += 1) {
      const verifier = generatePkceVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/u);
    }
  });

  it('rejects out-of-range verifier byte lengths', () => {
    expect(() => generatePkceVerifier(8)).toThrow(RangeError);
    expect(() => generatePkceVerifier(1024)).toThrow(RangeError);
  });

  it('computes S256 challenges that match the manual algorithm', () => {
    const verifier = 'verifier-with-known-bytes-12345';
    const expected = createHash('sha256').update(verifier, 'ascii').digest();
    const expectedChallenge = expected
      .toString('base64')
      .replace(/=+$/u, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    expect(computePkceChallenge(verifier)).toBe(expectedChallenge);
  });

  it('generateState returns base64url-safe random strings', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/u);
  });

  it('base64Url accepts both string and buffer inputs', () => {
    expect(base64Url('hello')).toBe('aGVsbG8');
    expect(base64Url(Buffer.from([0xff, 0xfe]))).toBe('__4');
  });
});
