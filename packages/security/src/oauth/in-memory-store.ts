/**
 * In-memory implementation of the {@link OAuthServerStore} contract.
 * Used by:
 *
 * - The unit-test fixtures.
 * - Library callers that have not wired up the SQLite-backed store
 *   (`@graphorin/store-sqlite`'s `oauth_servers` migration).
 *
 * @packageDocumentation
 */

import type { OAuthServerRecord, OAuthServerStore } from '@graphorin/core/contracts';

/**
 * Create a new in-memory OAuth server store. Records are kept in
 * insertion order so `list()` returns deterministic snapshots.
 *
 * @stable
 */
export function createInMemoryOAuthServerStore(): OAuthServerStore {
  const records = new Map<string, OAuthServerRecord>();
  return {
    async put(record) {
      records.set(record.id, Object.freeze({ ...record }));
    },
    async get(id) {
      return records.get(id) ?? null;
    },
    async list() {
      return Object.freeze([...records.values()]);
    },
    async update(id, patch) {
      const existing = records.get(id);
      if (existing === undefined) {
        throw new Error(`OAuth server '${id}' not found.`);
      }
      const merged: OAuthServerRecord = Object.freeze({
        ...existing,
        ...patch,
        updatedAt: patch.updatedAt ?? Date.now(),
      });
      records.set(id, merged);
      return merged;
    },
    async delete(id) {
      records.delete(id);
    },
  };
}
