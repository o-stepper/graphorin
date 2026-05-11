import type { SecretResolver } from '@graphorin/core/contracts';

import { MissingPeerDependencyError, SecretResolutionError } from '../errors.js';
import { getQueryParam, type ParsedSecretRef } from '../secret-ref.js';
import { SecretValue } from '../secret-value.js';

/**
 * Service prefix used for every keyring entry written by the framework.
 * Picking a stable prefix makes it possible for users to inspect the
 * OS keychain (Keychain Access on macOS, Credential Manager on
 * Windows, `seahorse` / `gnome-keyring` on Linux) and easily filter
 * Graphorin-owned credentials.
 *
 * @stable
 */
export const KEYRING_DEFAULT_SERVICE = 'graphorin';

type KeyringEntryCtor = new (
  service: string,
  account: string,
) => {
  getPassword(): string | null;
  setPassword(value: string): void;
  deletePassword(): boolean;
};

let entryCtorCache: KeyringEntryCtor | null = null;
let entryCtorAttempted = false;

/**
 * Lazy-load the optional `@napi-rs/keyring` peer dependency. We swallow
 * `ERR_MODULE_NOT_FOUND` and surface a `MissingPeerDependencyError`
 * with an actionable hint when the resolver is used; other errors
 * (e.g. native-bindings load failures) propagate.
 */
async function loadKeyringEntryCtor(): Promise<KeyringEntryCtor> {
  if (entryCtorCache) return entryCtorCache;
  if (entryCtorAttempted && !entryCtorCache) {
    throw new MissingPeerDependencyError(
      '@napi-rs/keyring',
      'KeyringSecretsStore / keyring: SecretRef resolver',
    );
  }
  entryCtorAttempted = true;
  try {
    const mod = (await import('@napi-rs/keyring')) as { Entry?: KeyringEntryCtor };
    if (!mod.Entry) {
      throw new MissingPeerDependencyError(
        '@napi-rs/keyring',
        'KeyringSecretsStore / keyring: SecretRef resolver',
      );
    }
    entryCtorCache = mod.Entry;
    return mod.Entry;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new MissingPeerDependencyError(
        '@napi-rs/keyring',
        'KeyringSecretsStore / keyring: SecretRef resolver',
        { cause: err },
      );
    }
    throw err;
  }
}

/**
 * Test-only override that lets fixtures inject a stub keyring instead
 * of taking a hard dependency on `@napi-rs/keyring` in the unit tests.
 *
 * @experimental
 */
export function _setKeyringEntryCtorForTesting(ctor: KeyringEntryCtor | null): void {
  entryCtorCache = ctor;
  entryCtorAttempted = ctor !== null;
}

/**
 * Resolver for the `keyring:` scheme. Reads the OS keychain via
 * `@napi-rs/keyring`. The path component is the account name; an
 * optional `?service=...` overrides the default service prefix.
 *
 * @stable
 */
export const keyringResolver: SecretResolver = {
  scheme: 'keyring',
  async resolve(ref) {
    const parsed = ref as ParsedSecretRef;
    if (parsed.path.length === 0) {
      throw new SecretResolutionError(
        'keyring',
        parsed.raw,
        "keyring: ref must include the account name (e.g. 'keyring:openai_api_key').",
      );
    }
    const service = getQueryParam(parsed, 'service') ?? KEYRING_DEFAULT_SERVICE;
    const Entry = await loadKeyringEntryCtor();
    let raw: string | null;
    try {
      const entry = new Entry(service, parsed.path);
      raw = entry.getPassword();
    } catch (err) {
      throw new SecretResolutionError(
        'keyring',
        parsed.raw,
        (err as Error).message ?? 'keyring read failed',
        {
          cause: err,
        },
      );
    }
    if (raw === null || raw === undefined) {
      throw new SecretResolutionError(
        'keyring',
        parsed.raw,
        `OS keyring has no entry for service='${service}', account='${parsed.path}'.`,
      );
    }
    return SecretValue.fromString(raw, {
      source: { resolver: 'keyring', ref: parsed.raw },
    });
  },
};

/**
 * Internal helper exposed to `KeyringSecretsStore` so the store and the
 * resolver share a single peer-dependency loader.
 *
 * @internal
 */
export async function _getKeyringEntryCtor(): Promise<KeyringEntryCtor> {
  return loadKeyringEntryCtor();
}
