import type { SecretResolver } from '@graphorin/core/contracts';

import { LiteralSecretsForbiddenError } from '../errors.js';
import type { ParsedSecretRef } from '../secret-ref.js';
import { SecretValue } from '../secret-value.js';

/**
 * Mutable runtime configuration for the `literal:` scheme. The default
 * triple gate (`process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS === '1'`,
 * `setLiteralAllowed(true)`, and `NODE_ENV !== 'production'`) refuses
 * to resolve `literal:` SecretRefs.
 */
let configAllow = false;
let warnedOnce = false;

/**
 * Programmatic gate — set from `secrets.allowLiteral: true` in user
 * config. Must be combined with the env gate to actually unlock the
 * `literal:` scheme.
 *
 * @stable
 */
export function setLiteralAllowed(allowed: boolean): void {
  configAllow = allowed;
}

/**
 * Whether the `literal:` scheme is currently active. Used by the
 * factory's status reporter and by the resolver itself.
 *
 * @stable
 */
export function isLiteralAllowed(): {
  allowed: boolean;
  reasons: ReadonlyArray<string>;
} {
  const reasons: string[] = [];
  if (process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS !== '1') {
    reasons.push('GRAPHORIN_ALLOW_LITERAL_SECRETS env not set');
  }
  if (!configAllow) {
    reasons.push('secrets.allowLiteral=false in code');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION !== '1'
  ) {
    reasons.push(
      "NODE_ENV='production' (set GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION=1 to override; deliberately discouraged)",
    );
  }
  return { allowed: reasons.length === 0, reasons: Object.freeze(reasons) };
}

/**
 * Reset the literal-resolver state. Used by tests.
 *
 * @experimental
 */
export function _resetLiteralResolverForTesting(): void {
  configAllow = false;
  warnedOnce = false;
}

/**
 * Resolver for the `literal:` scheme. Triple-gated and tests-only.
 *
 * @stable
 */
export const literalResolver: SecretResolver = {
  scheme: 'literal',
  async resolve(ref) {
    const parsed = ref as ParsedSecretRef;
    const status = isLiteralAllowed();
    if (!status.allowed) {
      throw new LiteralSecretsForbiddenError(status.reasons.join('; '));
    }
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        '[graphorin/security] literal: SecretRef accepted (test-only gate). Never use literal: in production.',
      );
    }
    return SecretValue.fromString(parsed.path, {
      source: { resolver: 'literal', ref: parsed.raw },
    });
  },
};
