import type { IdempotencyRecord, IdempotencyStore } from '@graphorin/store-sqlite';

/**
 * In-memory `IdempotencyStore` for tests.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  readonly rows = new Map<string, IdempotencyRecord>();

  async put(record: IdempotencyRecord): Promise<void> {
    this.rows.set(record.key, record);
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    return this.rows.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.rows.delete(key);
  }

  async prune(olderThan: number): Promise<number> {
    let n = 0;
    for (const [key, record] of this.rows) {
      if (record.expiresAt < olderThan) {
        this.rows.delete(key);
        n += 1;
      }
    }
    return n;
  }
}
