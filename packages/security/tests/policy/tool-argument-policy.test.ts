/**
 * D4 Progent tool-argument policy + Rule-of-Two capability profiles
 * (pure decision engine).
 */

import { describe, expect, it } from 'vitest';
import {
  buildRuleOfTwoPolicy,
  evaluatePermissionDecision,
  evaluateToolArgumentPolicy,
  isToolDeniedByName,
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

describe('evaluatePermissionDecision - four-value vocabulary (E1)', () => {
  it('deny > defer > ask > allow across matching rules', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        { effect: 'allow', tool: '*' },
        { effect: 'ask', tool: 'send_*', reason: 'outbound needs a human' },
        { effect: 'defer', tool: 'send_money', reason: 'park it' },
        { effect: 'deny', tool: 'send_money_prod', reason: 'never' },
      ],
    };
    const facts = (toolName: string) =>
      ({ toolName, sideEffectClass: 'external-stateful' }) as const;
    expect(evaluatePermissionDecision(policy, facts('read_file')).effect).toBe('allow');
    const asked = evaluatePermissionDecision(policy, facts('send_email'));
    expect(asked).toEqual({ effect: 'ask', reason: 'outbound needs a human' });
    // send_money matches ask AND defer - defer outranks ask.
    const deferred = evaluatePermissionDecision(policy, facts('send_money'));
    expect(deferred).toEqual({ effect: 'defer', reason: 'park it' });
    // send_money_prod matches ask, defer (prefix) and deny - deny wins.
    const denied = evaluatePermissionDecision(policy, facts('send_money_prod'));
    expect(denied.effect).toBe('deny');
    if (denied.effect === 'deny') expect(denied.reason).toBe('never');
  });

  it("'forbid' stays accepted as the alias of 'deny'", () => {
    const policy: ToolArgumentPolicy = {
      rules: [{ effect: 'forbid', tool: 'rm_*', reason: 'legacy spelling' }],
    };
    const decision = evaluatePermissionDecision(policy, {
      toolName: 'rm_rf',
      sideEffectClass: 'side-effecting',
    });
    expect(decision).toEqual({ effect: 'deny', reason: 'legacy spelling' });
  });

  it('a broad late allow never re-opens an ask/defer/deny', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        { effect: 'ask', tool: 'deploy' },
        { effect: 'allow', tool: '*' },
      ],
    };
    expect(
      evaluatePermissionDecision(policy, {
        toolName: 'deploy',
        sideEffectClass: 'external-stateful',
      }).effect,
    ).toBe('ask');
  });

  it('default-deny sensitive applies only when nothing matched', () => {
    const policy: ToolArgumentPolicy = { rules: [], defaultDenySensitive: true };
    expect(
      evaluatePermissionDecision(policy, {
        toolName: 'read_secret',
        sideEffectClass: 'read-only',
        sensitive: true,
      }).effect,
    ).toBe('deny');
    const withAllow: ToolArgumentPolicy = {
      rules: [{ effect: 'allow', tool: 'read_secret' }],
      defaultDenySensitive: true,
    };
    expect(
      evaluatePermissionDecision(withAllow, {
        toolName: 'read_secret',
        sideEffectClass: 'read-only',
        sensitive: true,
      }).effect,
    ).toBe('allow');
  });

  it('binary projection maps every non-allow effect to forbid (fail-closed)', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        { effect: 'ask', tool: 'deploy', reason: 'needs approval' },
        { effect: 'defer', tool: 'send_money', reason: 'park it' },
      ],
    };
    const projectedAsk = evaluateToolArgumentPolicy(policy, {
      toolName: 'deploy',
      sideEffectClass: 'external-stateful',
    });
    expect(projectedAsk).toEqual({ effect: 'forbid', reason: 'needs approval' });
    const projectedDefer = evaluateToolArgumentPolicy(policy, {
      toolName: 'send_money',
      sideEffectClass: 'external-stateful',
    });
    expect(projectedDefer.effect).toBe('forbid');
  });
});

describe('isToolDeniedByName - advertise-time deny-by-name (E1)', () => {
  it('matches predicate-free deny/forbid rules only', () => {
    const policy: ToolArgumentPolicy = {
      rules: [
        { effect: 'deny', tool: 'schedule_*', reason: 'no recursive scheduling' },
        { effect: 'forbid', tool: 'rm_rf' },
        { effect: 'deny', tool: 'transfer', when: () => true, reason: 'arg-dependent' },
        { effect: 'ask', tool: 'deploy' },
      ],
    };
    expect(isToolDeniedByName(policy, 'schedule_cron')).toEqual({
      denied: true,
      reason: 'no recursive scheduling',
    });
    expect(isToolDeniedByName(policy, 'rm_rf').denied).toBe(true);
    // A when-predicate rule is call-time only - names stay advertised.
    expect(isToolDeniedByName(policy, 'transfer')).toEqual({ denied: false });
    // ask/defer never deny a name.
    expect(isToolDeniedByName(policy, 'deploy')).toEqual({ denied: false });
    expect(isToolDeniedByName(policy, 'read_file')).toEqual({ denied: false });
  });
});
