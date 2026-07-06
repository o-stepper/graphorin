/**
 * D4 Progent tool-argument policy + Rule-of-Two capability profiles
 * (pure decision engine).
 */

import { describe, expect, it } from 'vitest';
import {
  buildRuleOfTwoPolicy,
  evaluateToolArgumentPolicy,
  type ToolArgumentPolicy,
} from '../../src/policy/index.js';

describe('evaluateToolArgumentPolicy - forbid-before-allow', () => {
  it('allows by default with no rules', () => {
    const policy: ToolArgumentPolicy = { rules: [] };
    expect(
      evaluateToolArgumentPolicy(policy, {
        toolName: 'send_email',
        sideEffectClass: 'external-stateful',
      }).effect,
    ).toBe('allow');
  });

  it('forbid always beats allow regardless of order', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        { effect: 'allow', tool: '*' },
        { effect: 'forbid', tool: 'delete_*', reason: 'destructive' },
      ],
    };
    expect(
      evaluateToolArgumentPolicy(policy, { toolName: 'read_file', sideEffectClass: 'read-only' })
        .effect,
    ).toBe('allow');
    const denied = evaluateToolArgumentPolicy(policy, {
      toolName: 'delete_bucket',
      sideEffectClass: 'external-stateful',
    });
    expect(denied.effect).toBe('forbid');
    if (denied.effect === 'forbid') expect(denied.reason).toBe('destructive');
  });

  it('matches argument predicates', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        {
          effect: 'forbid',
          tool: 'transfer',
          when: (f) =>
            (f.args as { amount?: number } | undefined)?.amount !== undefined &&
            (f.args as { amount: number }).amount > 1000,
          reason: 'over limit',
        },
      ],
    };
    expect(
      evaluateToolArgumentPolicy(policy, {
        toolName: 'transfer',
        sideEffectClass: 'external-stateful',
        args: { amount: 500 },
      }).effect,
    ).toBe('allow');
    expect(
      evaluateToolArgumentPolicy(policy, {
        toolName: 'transfer',
        sideEffectClass: 'external-stateful',
        args: { amount: 5000 },
      }).effect,
    ).toBe('forbid');
  });

  it('default-denies sensitive tools without an explicit allow', () => {
    const policy: ToolArgumentPolicy = {
      rules: [{ effect: 'allow', tool: 'read_public' }],
      defaultDenySensitive: true,
    };
    const blocked = evaluateToolArgumentPolicy(policy, {
      toolName: 'read_secret',
      sideEffectClass: 'read-only',
      sensitive: true,
    });
    expect(blocked.effect).toBe('forbid');
    // An explicit allow re-opens the sensitive tool.
    const allowPolicy: ToolArgumentPolicy = {
      rules: [{ effect: 'allow', tool: 'read_secret' }],
      defaultDenySensitive: true,
    };
    expect(
      evaluateToolArgumentPolicy(allowPolicy, {
        toolName: 'read_secret',
        sideEffectClass: 'read-only',
        sensitive: true,
      }).effect,
    ).toBe('allow');
  });
});

describe('W-101 - Rule-of-Two untrustedInput leg is enforced', () => {
  it('a profile denying untrustedInput forbids untrusted-source tools, allows first-party', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: false,
      sensitiveData: true,
      externalSideEffects: true,
    });
    const blocked = evaluateToolArgumentPolicy(c.policy, {
      toolName: 'web_search',
      sideEffectClass: 'read-only',
      untrustedSource: true,
      args: {},
    });
    expect(blocked.effect).toBe('forbid');
    if (blocked.effect === 'forbid') {
      expect(blocked.reason).toContain('untrusted input');
    }
    const allowed = evaluateToolArgumentPolicy(c.policy, {
      toolName: 'local_calc',
      sideEffectClass: 'read-only',
      untrustedSource: false,
      args: {},
    });
    expect(allowed.effect).toBe('allow');
    // Bookkeeping surfaces are unchanged.
    expect(c.heldLegs).toEqual(['sensitive-data', 'external-side-effects']);
    expect(c.holdsFullTrifecta).toBe(false);
  });

  it('a profile holding untrustedInput adds no such rule', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: true,
      sensitiveData: false,
      externalSideEffects: true,
    });
    const verdict = evaluateToolArgumentPolicy(c.policy, {
      toolName: 'web_search',
      sideEffectClass: 'read-only',
      untrustedSource: true,
      args: {},
    });
    expect(verdict.effect).toBe('allow');
  });

  it('forbid-before-allow survives composition with an explicit allow rule', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: false,
      sensitiveData: true,
      externalSideEffects: true,
    });
    const composed = {
      rules: [...c.policy.rules, { effect: 'allow' as const, tool: 'web_search' }],
      defaultDenySensitive: c.policy.defaultDenySensitive ?? false,
    };
    const verdict = evaluateToolArgumentPolicy(composed, {
      toolName: 'web_search',
      sideEffectClass: 'read-only',
      untrustedSource: true,
      args: {},
    });
    expect(verdict.effect).toBe('forbid');
  });
});

describe('buildRuleOfTwoPolicy - capability profiles', () => {
  it('flags the full trifecta and produces no capability floor', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: true,
      sensitiveData: true,
      externalSideEffects: true,
    });
    expect(c.holdsFullTrifecta).toBe(true);
    expect(c.heldLegs).toHaveLength(3);
    expect(c.capability).toBeUndefined();
  });

  it('denying external side effects yields a read-only floor + writer forbid', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: true,
      sensitiveData: true,
      externalSideEffects: false,
    });
    expect(c.holdsFullTrifecta).toBe(false);
    expect(c.capability).toBe('read-only');
    const denied = evaluateToolArgumentPolicy(c.policy, {
      toolName: 'send_email',
      sideEffectClass: 'external-stateful',
    });
    expect(denied.effect).toBe('forbid');
    const allowed = evaluateToolArgumentPolicy(c.policy, {
      toolName: 'read_web',
      sideEffectClass: 'read-only',
    });
    expect(allowed.effect).toBe('allow');
  });

  it('denying sensitive data default-denies sensitive tools', () => {
    const c = buildRuleOfTwoPolicy({
      untrustedInput: true,
      sensitiveData: false,
      externalSideEffects: true,
    });
    expect(c.capability).toBeUndefined();
    expect(
      evaluateToolArgumentPolicy(c.policy, {
        toolName: 'read_secret',
        sideEffectClass: 'read-only',
        sensitive: true,
      }).effect,
    ).toBe('forbid');
    // Non-sensitive writer stays allowed (external side effects held).
    expect(
      evaluateToolArgumentPolicy(c.policy, {
        toolName: 'send_email',
        sideEffectClass: 'external-stateful',
      }).effect,
    ).toBe('allow');
  });
});
