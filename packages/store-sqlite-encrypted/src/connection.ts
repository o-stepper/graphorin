/**
 * Convenience wrapper around `openConnection` from `@graphorin/store-
 * sqlite/connection` that pre-loads the cipher peer driver and applies
 * the cipher PRAGMAs in the right order.
 *
 * Most callers never reach this directly — the standard path is to
 * pass `{ encryption: { enabled: true, passphraseResolver } }` to the
 * store-sqlite facade and let it consult the canonical
 * `loadCipherDriver`. This helper exists for the encrypt / rekey
 * runners (which need a "raw" handle on a freshly created cipher DB
 * before the standard schema migrations run) and for advanced
 * consumers that want to build a custom store on top of an encrypted
 * connection.
 *
 * @packageDocumentation
 */

import {
  type OpenConnectionOptions,
  openConnection,
  type SqliteConnection,
} from '@graphorin/store-sqlite/connection';

import { loadCipherPeer } from './cipher-peer.js';

/**
 * Opens an encrypted SQLite connection. Differs from `openConnection`
 * only in that the cipher peer driver is preloaded — callers that
 * supply an `encryption.passphraseResolver` get the same behaviour as
 * `openConnection({ encryption })` plus an explicit fail-fast on a
 * missing cipher peer.
 *
 * @stable
 */
export async function createEncryptedConnection(
  options: OpenConnectionOptions,
): Promise<SqliteConnection> {
  if (options.encryption?.enabled !== true) {
    throw new Error(
      '[graphorin/store-sqlite-encrypted] createEncryptedConnection requires ' +
        '`encryption.enabled: true`. Use `openConnection` directly for unencrypted DBs.',
    );
  }
  const ctor = await loadCipherPeer();
  return openConnection({
    ...options,
    cipherLoader: async () => ctor,
  });
}
