import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';

/** In-memory `AuthTokenStore` for tests. */
export function createMemoryAuthTokenStore(): AuthTokenStore & {
  readonly snapshot: () => ReadonlyArray<AuthTokenRecord>;
} {
  const rows = new Map<string, AuthTokenRecord>();
  return {
    async put(record) {
      rows.set(record.id, record);
    },
    async get(id) {
      return rows.get(id) ?? null;
    },
    async list() {
      return Object.freeze([...rows.values()]);
    },
    async revoke(id, revokedAt) {
      const existing = rows.get(id);
      if (existing === undefined) return;
      rows.set(id, { ...existing, revokedAt });
    },
    async recordUse(id, usedAt) {
      const existing = rows.get(id);
      if (existing === undefined) return;
      rows.set(id, { ...existing, lastUsedAt: usedAt });
    },
    snapshot() {
      return Object.freeze([...rows.values()]);
    },
  };
}
