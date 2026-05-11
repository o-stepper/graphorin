import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';

/**
 * In-memory `AuthTokenStore` used by the server tests so we never
 * touch the SQLite layer when the unit under test is the HTTP /
 * lifecycle plumbing.
 */
export class InMemoryAuthTokenStore implements AuthTokenStore {
  readonly records = new Map<string, AuthTokenRecord>();

  async put(record: AuthTokenRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async get(id: string): Promise<AuthTokenRecord | null> {
    return this.records.get(id) ?? null;
  }

  async list(): Promise<readonly AuthTokenRecord[]> {
    return Array.from(this.records.values());
  }

  async revoke(id: string, ts: string): Promise<void> {
    const record = this.records.get(id);
    if (record === undefined) return;
    this.records.set(id, { ...record, revokedAt: ts });
  }

  async recordUse(id: string, ts: string): Promise<void> {
    const record = this.records.get(id);
    if (record === undefined) return;
    this.records.set(id, { ...record, lastUsedAt: ts });
  }
}
