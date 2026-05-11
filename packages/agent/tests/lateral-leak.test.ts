import { describe, expect, it } from 'vitest';
import {
  CausalityMonitor,
  computeSourceTrust,
  evaluateMerge,
  guardOutboundContent,
  ProtocolInjectionRejectError,
  resolvePolicy,
} from '../src/index.js';

describe('CausalityMonitor', () => {
  it('does nothing when strictness is off', () => {
    const m = new CausalityMonitor({ strictness: 'off' });
    m.recordCall('tool.error:SecretAccessDenied');
    const r = m.checkMessage('the secret is...');
    expect(r.leakDetected).toBe(false);
  });

  it('flags causality laundering when the chain has a denial AND the message references it', () => {
    const m = new CausalityMonitor({ strictness: 'detect-and-flag' });
    m.recordCall('tool:fetch_user_profile');
    m.recordCall('tool.error:SecretAccessDenied[secretId=user-ssn]');
    m.recordCall('tool:summarize');
    const r = m.checkMessage('I cannot reveal the SecretAccessDenied SSN, but it is...');
    expect(r.leakDetected).toBe(true);
    expect(r.severity).toBe('warn');
    expect(r.decision).toBe('flag');
  });

  it('blocks when strictness is detect-and-block', () => {
    const m = new CausalityMonitor({ strictness: 'detect-and-block' });
    m.recordCall('SandboxViolation');
    const r = m.checkMessage('the SandboxViolation said...');
    expect(r.severity).toBe('block');
    expect(r.decision).toBe('block');
  });

  it('does not flag when the chain has no denial', () => {
    const m = new CausalityMonitor({ strictness: 'detect-and-flag' });
    m.recordCall('tool:lookup');
    const r = m.checkMessage('the result is 42');
    expect(r.leakDetected).toBe(false);
  });

  it('respects maxChainDepth', () => {
    const m = new CausalityMonitor({ strictness: 'detect-and-flag', maxChainDepth: 3 });
    for (let i = 0; i < 10; i++) m.recordCall(`tool:t${i}`);
    expect(m.chain.length).toBe(3);
  });
});

describe('computeSourceTrust', () => {
  it('multiplies baseline by provenance and history', () => {
    const t = computeSourceTrust({
      agentId: 'a',
      trustClass: 'public-tls',
      origin: 'mcp',
      historyAdjustment: 1.0,
    });
    expect(t).toBeCloseTo(0.7 * 0.7, 5);
  });
  it('honours operator overrides', () => {
    const t = computeSourceTrust(
      {
        agentId: 'a',
        trustClass: 'public-tls',
        origin: 'mcp',
      },
      { a: 0.95 },
    );
    expect(t).toBe(0.95);
  });
});

describe('evaluateMerge', () => {
  it('flags a low-trust child contributing more than maxLowTrustWeight', () => {
    const r = evaluateMerge(
      [
        { agentId: 'trusted', sourceTrust: 0.9, contributionWeight: 0.4 },
        { agentId: 'attacker', sourceTrust: 0.3, contributionWeight: 0.4 },
      ],
      { strictness: 'detect-and-flag' },
    );
    expect(r.biased).toBe(true);
    expect(r.offendingChild).toBe('attacker');
    expect(r.decision).toBe('flag');
  });
  it('passes through when no child crosses the threshold', () => {
    const r = evaluateMerge(
      [
        { agentId: 'trusted', sourceTrust: 0.9, contributionWeight: 0.7 },
        { agentId: 'mid', sourceTrust: 0.6, contributionWeight: 0.3 },
      ],
      { strictness: 'detect-and-flag' },
    );
    expect(r.biased).toBe(false);
  });
});

describe('protocol-guard', () => {
  it('escapes control chars on the SSE boundary by default', () => {
    const out = guardOutboundContent('hello\r\n\r\nworld', 'sse');
    expect(out.decision).toBe('escaped');
    expect(out.content).not.toContain('\r\n\r\n');
  });
  it('replaces control chars on the WS boundary by default', () => {
    const out = guardOutboundContent('a\x00b', 'ws');
    expect(out.decision).toBe('replaced');
    expect(out.content).toContain('\uFFFD');
  });
  it('rejects on operator opt-in', () => {
    expect(() => guardOutboundContent('a\x00b', 'sse', { sse: 'reject' })).toThrowError(
      ProtocolInjectionRejectError,
    );
  });
  it('passes through pure-ASCII payloads', () => {
    const out = guardOutboundContent('plain text', 'sse');
    expect(out.decision).toBe('pass-through');
    expect(out.content).toBe('plain text');
  });
  it('resolves the canonical default per boundary', () => {
    expect(resolvePolicy('sse')).toBe('strict');
    expect(resolvePolicy('http-header')).toBe('strict');
    expect(resolvePolicy('ws')).toBe('replace');
    expect(resolvePolicy('rest-body')).toBe('replace');
    expect(resolvePolicy('audit')).toBe('strict');
  });
});
