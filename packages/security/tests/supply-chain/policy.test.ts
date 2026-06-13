import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setFrameworkDenylistForTesting,
  assertPolicyAllows,
  evaluateSupplyChainPolicy,
  matchesGlob,
  resolveTrustPolicy,
  SkillInstallDeniedError,
  TrustLevelEscalationError,
} from '../../src/supply-chain/index.js';

describe('@graphorin/security/supply-chain — policy resolver', () => {
  beforeEach(() => {
    _setFrameworkDenylistForTesting([]);
  });
  afterEach(() => {
    _setFrameworkDenylistForTesting([]);
  });

  it('matches scope-wide and exact patterns', () => {
    expect(matchesGlob('@my-org/skill', '@my-org/*')).toBe(true);
    expect(matchesGlob('@my-org/skill', '@other-org/*')).toBe(false);
    expect(matchesGlob('@vendor/specific', '@vendor/specific')).toBe(true);
    expect(matchesGlob('@vendor/specific/sub', '@vendor/specific')).toBe(false);
  });

  it('returns deny when the package is on the denylist', () => {
    const decision = evaluateSupplyChainPolicy('@evil/abc', { denylist: ['@evil/*'] });
    expect(decision.outcome).toBe('deny');
    expect(decision.outcome === 'deny' && decision.source).toBe('denylist');
  });

  it('returns allow when the package matches the allowlist', () => {
    const decision = evaluateSupplyChainPolicy('@my-org/skill', {
      allowlist: ['@my-org/*'],
      denylist: ['@my-org/*'],
    });
    expect(decision.outcome).toBe('allow');
  });

  it('deny-wins precedence lets an explicit denylist entry override a broad allowlist (SPL-20)', () => {
    const decision = evaluateSupplyChainPolicy('@my-org/skill', {
      allowlist: ['@my-org/*'],
      denylist: ['@my-org/skill'],
      precedence: 'deny-wins',
    });
    expect(decision.outcome).toBe('deny');
    expect(decision.outcome === 'deny' && decision.source).toBe('denylist');
  });

  it('default precedence keeps allow-wins so a scope can be denied with specific exceptions', () => {
    const decision = evaluateSupplyChainPolicy('@my-org/skill', {
      allowlist: ['@my-org/skill'],
      denylist: ['@my-org/*'],
    });
    expect(decision.outcome).toBe('allow');
  });

  it('honours the framework denylist when graphorinDenylist is auto', () => {
    _setFrameworkDenylistForTesting(['@known-bad/*']);
    const decision = evaluateSupplyChainPolicy('@known-bad/abc', {
      graphorinDenylist: 'auto',
    });
    expect(decision.outcome).toBe('deny');
    expect(decision.outcome === 'deny' && decision.source).toBe('framework-denylist');
  });

  it('assertPolicyAllows throws when the package is denied', () => {
    expect(() => assertPolicyAllows('@evil/abc', { denylist: ['@evil/*'] })).toThrow(
      SkillInstallDeniedError,
    );
  });

  it('resolves the default trust level for each source', () => {
    expect(resolveTrustPolicy({ kind: 'folder', path: '/x' }, undefined).level).toBe('trusted');
    expect(resolveTrustPolicy({ kind: 'npm-package', packageName: 'x' }, undefined).level).toBe(
      'untrusted',
    );
    expect(resolveTrustPolicy({ kind: 'git-repo', url: 'x' }, undefined).level).toBe('untrusted');
  });

  it('refuses trusted-with-scripts for npm and git installs', () => {
    expect(() =>
      resolveTrustPolicy({ kind: 'npm-package', packageName: '@vendor/x' }, 'trusted-with-scripts'),
    ).toThrow(TrustLevelEscalationError);
  });

  it('forces signature + ignore-scripts for untrusted', () => {
    const policy = resolveTrustPolicy({ kind: 'npm-package', packageName: 'x' }, 'untrusted');
    expect(policy.ignoreScripts).toBe(true);
    expect(policy.signature.required).toBe(true);
    expect(policy.signature.rejectIfMissing).toBe(true);
    expect(policy.sandbox).toBe('strict-default');
  });

  it('allows trusted-with-scripts for folder skills with required signature', () => {
    const policy = resolveTrustPolicy({ kind: 'folder', path: '/x' }, 'trusted-with-scripts');
    expect(policy.ignoreScripts).toBe(false);
    expect(policy.signature.required).toBe(true);
  });
});
