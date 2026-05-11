import type {
  SecretResolver,
  SecretResolverContext,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';

import { SecretResolutionError } from '../errors.js';
import type { ParsedSecretRef } from '../secret-ref.js';

/**
 * Optional callback used by the `ref:` scheme to ask the active
 * `SecretsStore` for a value. The factory wires this up so the
 * resolver can dispatch through whatever fallback chain is currently
 * active without taking a hard dependency on the store module.
 *
 * @internal
 */
export type RefStoreLookup = (
  key: string,
  ctx?: SecretResolverContext,
) => Promise<SecretValueContract | null>;

let refStoreLookup: RefStoreLookup | undefined;

/**
 * Wire up the `ref:` resolver against the active `SecretsStore`. The
 * factory calls this whenever it activates a new store; tests use it
 * to inject a deterministic stub.
 *
 * @stable
 */
export function setRefStoreLookup(lookup: RefStoreLookup | undefined): void {
  refStoreLookup = lookup;
}

/**
 * Resolver for the `ref:` scheme. Resolves the path component
 * through the active `SecretsStore` chain, allowing config files to
 * stay agnostic about which physical store backs a given key.
 *
 * @stable
 */
export const refResolver: SecretResolver = {
  scheme: 'ref',
  async resolve(ref, ctx) {
    const parsed = ref as ParsedSecretRef;
    if (parsed.path.length === 0) {
      throw new SecretResolutionError(
        'ref',
        parsed.raw,
        "ref: ref must include a key name (e.g. 'ref:openai_api_key').",
      );
    }
    if (!refStoreLookup) {
      throw new SecretResolutionError(
        'ref',
        parsed.raw,
        "No active SecretsStore is wired into the 'ref:' resolver. Call createSecretsStore({ kind: 'auto' }) at bootstrap, or setRefStoreLookup(...) for tests.",
      );
    }
    const value = await refStoreLookup(parsed.path, ctx);
    if (value === null || value === undefined) {
      throw new SecretResolutionError(
        'ref',
        parsed.raw,
        `Active SecretsStore returned no value for key '${parsed.path}'.`,
      );
    }
    return value;
  },
};
