import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { assessSecretStrength } from '../../src/hardening/weak-secret.js';

describe('assessSecretStrength', () => {
  it('accepts a 32-byte crypto-random secret', () => {
    const r = assessSecretStrength(randomBytes(32));
    expect(r.ok).toBe(true);
    expect(r.byteLength).toBe(32);
    expect(r.reason).toBeUndefined();
  });

  it('rejects a value below the minimum length', () => {
    const r = assessSecretStrength(Buffer.from('short'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('below the 32-byte minimum');
  });

  it('rejects the "test-pepper-32-bytes-aaaaaaaaaaaa" placeholder (long identical run)', () => {
    const r = assessSecretStrength(Buffer.from('test-pepper-32-bytes-aaaaaaaaaaaa', 'utf8'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('identical bytes');
  });

  it('rejects an all-identical 32-byte buffer on the entropy/run floor', () => {
    const r = assessSecretStrength(Buffer.alloc(64, 0x61));
    expect(r.ok).toBe(false);
    expect(r.maxIdenticalRun).toBe(64);
    expect(r.shannonBitsPerByte).toBe(0);
  });

  it('reports a near-8-bit entropy estimate for random input', () => {
    const r = assessSecretStrength(randomBytes(256));
    expect(r.shannonBitsPerByte).toBeGreaterThan(6);
    expect(r.distinctBytes).toBeGreaterThan(100);
  });

  it('honours custom thresholds', () => {
    const r = assessSecretStrength(randomBytes(16), { minBytes: 16 });
    expect(r.ok).toBe(true);
  });
});
