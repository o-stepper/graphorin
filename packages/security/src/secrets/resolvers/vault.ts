import type {
  SecretResolver,
  SecretResolverContext,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';

import { SecretResolutionError } from '../errors.js';
import type { ParsedSecretRef } from '../secret-ref.js';

/**
 * Concrete adapter signature plugged into `setVaultAdapter(...)`. The
 * built-in resolver only ships the **pattern** - a real Vault adapter
 * lives in the optional `@graphorin/secret-vault` package (post-MVP).
 *
 * @stable
 */
export type VaultAdapter = (
  ref: ParsedSecretRef,
  ctx: SecretResolverContext | undefined,
) => Promise<SecretValueContract>;

let activeAdapter: VaultAdapter | undefined;

/**
 * Register a runtime adapter for the `vault://` scheme. Calling this
 * twice replaces the previous adapter - matching the documented
 * "last registration wins" contract.
 *
 * @stable
 */
export function setVaultAdapter(adapter: VaultAdapter | undefined): void {
  activeAdapter = adapter;
}

/**
 * Built-in `vault://` resolver. Acts as a router for an optional
 * adapter - when no adapter is registered, it raises a typed
 * resolution error pointing at the documented escape hatch.
 *
 * @stable
 */
export const vaultResolver: SecretResolver = {
  scheme: 'vault',
  async resolve(ref, ctx) {
    const parsed = ref as ParsedSecretRef;
    if (!activeAdapter) {
      throw new SecretResolutionError(
        'vault',
        parsed.raw,
        "No 'vault://' adapter is registered. Install '@graphorin/secret-vault' (community / post-MVP) or call setVaultAdapter(myAdapter) at bootstrap.",
      );
    }
    return activeAdapter(parsed, ctx);
  },
};
