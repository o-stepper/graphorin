import { describe, expect, it } from 'vitest';

import { resolveSandbox } from '../../src/sandbox/tier-resolver.js';

describe('resolveSandbox', () => {
  it('returns NoneSandbox for built-in trusted tools', () => {
    const policy = resolveSandbox({ trustLevel: 'built-in' });
    expect(policy.kind).toBe('none');
    expect(policy.forced).toBe(false);
    expect(policy.noNetwork).toBe(false);
    expect(policy.noFilesystem).toBe(false);
  });

  it('returns worker-threads for user-defined tools by default', () => {
    const policy = resolveSandbox({ trustLevel: 'user-defined' });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.timeoutMs).toBe(5_000);
    expect(policy.maxMemoryMb).toBe(256);
    expect(policy.forced).toBe(false);
  });

  it('honours operator override on user-defined tools', () => {
    const policy = resolveSandbox({
      trustLevel: 'user-defined',
      override: { kind: 'isolated-vm', timeoutMs: 8_000, maxMemoryMb: 64 },
    });
    expect(policy.kind).toBe('isolated-vm');
    expect(policy.timeoutMs).toBe(8_000);
    expect(policy.maxMemoryMb).toBe(64);
    expect(policy.forced).toBe(false);
  });

  it('forces worker-threads + no-network + no-filesystem on untrusted skills', () => {
    const policy = resolveSandbox({
      trustLevel: 'untrusted',
      override: { kind: 'none', noNetwork: false, noFilesystem: false },
    });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.noNetwork).toBe(true);
    expect(policy.noFilesystem).toBe(true);
    expect(policy.forced).toBe(true);
    expect(policy.reason).toContain('mandatory');
    expect(policy.reason).toContain('override kind=none ignored');
    expect(policy.reason).toContain('noNetwork=false ignored');
    expect(policy.reason).toContain('noFilesystem=false ignored');
  });

  it('returns forced=false for untrusted when the operator does not try to widen the policy', () => {
    const policy = resolveSandbox({ trustLevel: 'untrusted' });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.noNetwork).toBe(true);
    expect(policy.noFilesystem).toBe(true);
    expect(policy.forced).toBe(false);
  });

  it('clamps invalid timeout / memory values back to the per-kind defaults', () => {
    const policy = resolveSandbox({
      trustLevel: 'user-defined',
      override: { timeoutMs: -1, maxMemoryMb: 0 },
    });
    expect(policy.timeoutMs).toBe(5_000);
    expect(policy.maxMemoryMb).toBe(256);
  });

  it('describes trusted skills as honour-operator', () => {
    const policy = resolveSandbox({ trustLevel: 'trusted' });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.reason).toContain("'trusted'");
  });
});

describe('SDF-10 - untrusted-tier wall-clock timeout floor', () => {
  it('an override timeoutMs:0 on the untrusted tier is ignored, yielding a positive forced timeout', () => {
    const policy = resolveSandbox({
      trustLevel: 'untrusted',
      override: { timeoutMs: 0 },
    });
    expect(policy.timeoutMs).toBeGreaterThan(0);
    expect(policy.forced).toBe(true);
  });

  it('a positive override is still honoured (above the floor)', () => {
    const policy = resolveSandbox({
      trustLevel: 'untrusted',
      override: { timeoutMs: 90_000 },
    });
    expect(policy.timeoutMs).toBe(90_000);
  });
});
