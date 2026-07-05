/**
 * Loads the `better-sqlite3-multiple-ciphers` cipher peer driver. The
 * peer is declared `optional: false` in this package's `package.json`
 * (the whole point of installing this sub-pack is to opt in to
 * encryption-at-rest), but we still wrap the import in a friendly
 * fail-fast helper so consumers see an actionable error rather than a
 * raw `ERR_MODULE_NOT_FOUND`.
 *
 * The peer is loaded lazily - importing this package on its own does
 * NOT load the native addon, so callers that only inspect the public
 * helpers (e.g. for documentation generation) pay no native-load cost.
 *
 * @packageDocumentation
 */

import type { BetterSqlite3Constructor } from '@graphorin/store-sqlite/connection';

/**
 * Raised when the cipher peer driver cannot be loaded. Distinct from
 * the matching `CipherPeerMissingError` in `@graphorin/store-sqlite/
 * encryption` so consumers can catch the two layers independently.
 *
 * @stable
 */
export class EncryptedStorePeerMissingError extends Error {
  override readonly name = 'EncryptedStorePeerMissingError';
}

/** @internal */
let CACHED_CTOR: BetterSqlite3Constructor | null = null;

/**
 * Loads `better-sqlite3-multiple-ciphers`. The result is cached for
 * the lifetime of the process so repeat callers (encrypt + rekey +
 * connection-open in the same process) share one native handle.
 *
 * @stable
 */
export async function loadCipherPeer(): Promise<BetterSqlite3Constructor> {
  if (CACHED_CTOR !== null) return CACHED_CTOR;
  try {
    const mod = (await import('better-sqlite3-multiple-ciphers')) as unknown as {
      default: BetterSqlite3Constructor;
    };
    CACHED_CTOR = mod.default;
    return CACHED_CTOR;
  } catch (err) {
    throw new EncryptedStorePeerMissingError(
      "the cipher peer 'better-sqlite3-multiple-ciphers' could not be loaded. " +
        'This sub-pack declares it as a required peer dependency; install it via ' +
        '`pnpm add better-sqlite3-multiple-ciphers@^12.9.0` (or rerun `pnpm install` ' +
        'after adding @graphorin/store-sqlite-encrypted).',
      { cause: err },
    );
  }
}

/**
 * Test-only escape hatch. Drops the cached constructor so the next
 * {@link loadCipherPeer} call re-imports the peer.
 *
 * @internal
 */
export function _resetCipherPeerCacheForTesting(): void {
  CACHED_CTOR = null;
}

/**
 * Test-only escape hatch. Pre-populates the cache with a stub driver
 * so unit tests can exercise the encrypt / rekey runners without
 * touching the native cipher addon.
 *
 * @internal
 */
export function _setCipherPeerForTesting(ctor: BetterSqlite3Constructor): void {
  CACHED_CTOR = ctor;
}
