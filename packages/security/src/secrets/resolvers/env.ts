import type { SecretResolver } from '@graphorin/core/contracts';

import { SecretResolutionError } from '../errors.js';
import { getQueryParam, type ParsedSecretRef } from '../secret-ref.js';
import { SecretValue } from '../secret-value.js';

/**
 * Resolver for the `env:` scheme. Reads `process.env[NAME]` and wraps
 * the result in a `SecretValue`. Honours an optional `?default=...`
 * fallback. Throws `SecretResolutionError` when the variable is not
 * set and no fallback is configured.
 *
 * @stable
 */
export const envResolver: SecretResolver = {
  scheme: 'env',
  async resolve(ref) {
    const parsed = ref as ParsedSecretRef;
    const name = parsed.path;
    if (name.length === 0) {
      throw new SecretResolutionError(
        'env',
        parsed.raw,
        "env: ref must include the variable name (e.g. 'env:OPENAI_API_KEY').",
      );
    }
    const fromEnv = process.env[name];
    const fallback = getQueryParam(parsed, 'default');
    const value = fromEnv ?? fallback;
    if (value === undefined) {
      throw new SecretResolutionError(
        'env',
        parsed.raw,
        `process.env[${name}] is not set and no '?default=' fallback was supplied.`,
      );
    }
    return SecretValue.fromString(value, { source: { resolver: 'env', ref: parsed.raw } });
  },
};
