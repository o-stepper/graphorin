/**
 * Allow / deny policy resolver for the skills supply chain. Patterns
 * follow npm-style globbing rules:
 *
 * - `@org/*` matches any package under the scope.
 * - `@vendor/specific-skill` is an exact match.
 * - `*` is a wildcard within a single segment.
 *
 * The resolver consults three layers - operator allowlist, operator
 * denylist, and the framework-curated denylist (post-MVP optional pull,
 * active only when `graphorinDenylist === 'auto'` AND a matching pattern
 * is registered via {@link _setFrameworkDenylistForTesting}).
 *
 * The order of the allow vs deny layers is governed by
 * `policy.precedence`:
 *
 * - `'allow-wins'` (default) - the allowlist short-circuits to `'allow'`
 *   before the deny lists are consulted, so an operator can deny a whole
 *   scope yet allow specific exceptions inside it.
 * - `'deny-wins'` - the deny lists are consulted first, so an explicit
 *   denylist entry is never overridden by a broad allowlist glob.
 *
 * @packageDocumentation
 */

import { SkillInstallDeniedError, TrustLevelEscalationError } from './errors.js';
import type {
  ResolvedSkillTrustPolicy,
  SkillSource,
  SkillTrustLevel,
  SupplyChainDecision,
  SupplyChainPolicy,
} from './types.js';

let frameworkDenylist: ReadonlyArray<string> = [];

/**
 * Override the framework-maintained denylist. The MVP keeps this
 * dormant - only the operator-managed denylist is consulted unless
 * tests inject patterns here.
 *
 * @experimental
 */
export function _setFrameworkDenylistForTesting(patterns: ReadonlyArray<string>): void {
  frameworkDenylist = Object.freeze([...patterns]);
}

/**
 * Evaluate the supply-chain policy for the supplied package name.
 *
 * @stable
 */
export function evaluateSupplyChainPolicy(
  packageName: string,
  policy: SupplyChainPolicy = {},
): SupplyChainDecision {
  const denyWins = policy.precedence === 'deny-wins';
  const first = denyWins ? matchDeny(packageName, policy) : matchAllow(packageName, policy);
  if (first !== undefined) return first;
  const second = denyWins ? matchAllow(packageName, policy) : matchDeny(packageName, policy);
  if (second !== undefined) return second;
  return Object.freeze({ outcome: 'allow' as const });
}

/** First matching allowlist pattern → `'allow'`, else `undefined`. */
function matchAllow(
  packageName: string,
  policy: SupplyChainPolicy,
): SupplyChainDecision | undefined {
  if (policy.allowlist === undefined) return undefined;
  for (const pattern of policy.allowlist) {
    if (matchesGlob(packageName, pattern)) return Object.freeze({ outcome: 'allow' as const });
  }
  return undefined;
}

/**
 * First matching operator-denylist (then framework-denylist when
 * `graphorinDenylist === 'auto'`) pattern → `'deny'`, else `undefined`.
 */
function matchDeny(
  packageName: string,
  policy: SupplyChainPolicy,
): SupplyChainDecision | undefined {
  if (policy.denylist !== undefined) {
    for (const pattern of policy.denylist) {
      if (matchesGlob(packageName, pattern)) {
        return Object.freeze({
          outcome: 'deny' as const,
          reason: pattern,
          source: 'denylist' as const,
        });
      }
    }
  }
  if (policy.graphorinDenylist === 'auto') {
    for (const pattern of frameworkDenylist) {
      if (matchesGlob(packageName, pattern)) {
        return Object.freeze({
          outcome: 'deny' as const,
          reason: pattern,
          source: 'framework-denylist' as const,
        });
      }
    }
  }
  return undefined;
}

/**
 * Throw {@link SkillInstallDeniedError} when the policy resolves to
 * `'deny'`. Returns silently otherwise so callers can chain it
 * inside a wider install pipeline.
 *
 * @stable
 */
export function assertPolicyAllows(packageName: string, policy: SupplyChainPolicy): void {
  const decision = evaluateSupplyChainPolicy(packageName, policy);
  if (decision.outcome === 'deny') {
    throw new SkillInstallDeniedError(packageName, decision.source, decision.reason);
  }
}

/**
 * Resolve the trust policy for a (source, trust-level) tuple. The
 * resolver enforces the project-wide rule that npm/git installs
 * always run with `--ignore-scripts` and that signature verification
 * is mandatory for `untrusted`.
 *
 * @stable
 */
export function resolveTrustPolicy(
  source: SkillSource,
  trustLevel: SkillTrustLevel | undefined,
): ResolvedSkillTrustPolicy {
  const effective: SkillTrustLevel = trustLevel ?? defaultTrustLevel(source);
  if (
    (source.kind === 'npm-package' || source.kind === 'git-repo') &&
    effective === 'trusted-with-scripts'
  ) {
    throw new TrustLevelEscalationError('trusted-with-scripts');
  }
  switch (effective) {
    case 'trusted':
      return Object.freeze({
        level: 'trusted' as const,
        ignoreScripts: true,
        signature: { required: false, rejectIfMissing: false },
        sandbox: 'inherit-frontmatter',
        audit: 'always',
      });
    case 'trusted-with-scripts':
      return Object.freeze({
        level: 'trusted-with-scripts' as const,
        ignoreScripts: false,
        signature: { required: true, rejectIfMissing: true },
        sandbox: 'inherit-frontmatter',
        audit: 'always',
      });
    case 'untrusted':
      return Object.freeze({
        level: 'untrusted' as const,
        ignoreScripts: true,
        signature: { required: true, rejectIfMissing: true },
        sandbox: 'strict-default',
        audit: 'always',
      });
    default: {
      const exhaustive: never = effective;
      void exhaustive;
      throw new TrustLevelEscalationError(String(effective));
    }
  }
}

function defaultTrustLevel(source: SkillSource): SkillTrustLevel {
  switch (source.kind) {
    case 'folder':
      return 'trusted';
    case 'npm-package':
    case 'git-repo':
      return 'untrusted';
    default: {
      const exhaustive: never = source;
      void exhaustive;
      return 'untrusted';
    }
  }
}

/**
 * Glob match for npm package patterns. Implements:
 *
 * - `@org/*` matches every package in the scope.
 * - `*` matches a single segment (no `/`).
 * - Plain strings match exactly.
 *
 * @stable
 */
export function matchesGlob(packageName: string, pattern: string): boolean {
  if (pattern === packageName) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern
    .split('*')
    .map((segment) => segment.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  const regex = new RegExp(`^${escaped}$`, 'u');
  return regex.test(packageName);
}
