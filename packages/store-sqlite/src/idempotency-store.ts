import type { SqliteConnection } from './connection.js';

/**
 * REST `Idempotency-Key` cache row. The key is the value sent by the
 * client; `requestHash` fingerprints the request body so a key reuse
 * with a different payload returns `409 Conflict` per the IETF
 * draft-07 (`DEC-142 / ADR-036`).
 *
 * @stable
 */
export interface IdempotencyRecord {
  readonly key: string;
  readonly requestHash: string;
  readonly statusCode: number;
  /** Cached response body - adapter-specific encoding (JSON in v0.1). */
  readonly response: unknown;
  readonly responseHeaders?: Readonly<Record<string, string>>;
  readonly scope?: string;
  readonly createdAt: number;
  readonly expiresAt: number;
}

/**
 * Pluggable idempotency cache. The `@graphorin/server` package
 * (Phase 14) consumes this surface; the schema itself ships in
 * Phase 05's migration 008 so the framework only owns one set of
 * SQL tables.
 *
 * @stable
 */
export interface IdempotencyStore {
  put(record: IdempotencyRecord): Promise<void>;
  get(key: string): Promise<IdempotencyRecord | null>;
  delete(key: string): Promise<void>;
  /**
   * Delete records whose expiry is older than the supplied epoch-ms
   * instant. Production caller: the server's hourly
   * `scheduleIdempotencyPruning` sweep (started by `app-lifecycle`),
   * so expired rows no longer accumulate forever.
   */
  prune(olderThan: number): Promise<number>;
}

/**
 * Default `IdempotencyStore` implementation.
 *
 * @stable
 */
export class SqliteIdempotencyStore implements IdempotencyStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(record: IdempotencyRecord): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO idempotency_records (
         key, request_hash, status_code, response_json, response_headers_json, scope, created_at, expires_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.key,
        record.requestHash,
        record.statusCode,
        JSON.stringify(record.response),
        record.responseHeaders ? JSON.stringify(record.responseHeaders) : null,
        record.scope ?? null,
        record.createdAt,
        record.expiresAt,
      ],
    );
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const row = this.#conn.get<IdempotencyRow>('SELECT * FROM idempotency_records WHERE key = ?', [
      key,
    ]);
    if (row === undefined) return null;
    return {
      key: row.key,
      requestHash: row.request_hash,
      statusCode: row.status_code,
      response: JSON.parse(row.response_json),
      ...(row.response_headers_json !== null
        ? { responseHeaders: JSON.parse(row.response_headers_json) }
        : {}),
      ...(row.scope !== null ? { scope: row.scope } : {}),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async delete(key: string): Promise<void> {
    this.#conn.run('DELETE FROM idempotency_records WHERE key = ?', [key]);
  }

  async prune(olderThan: number): Promise<number> {
    const before = this.#conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM idempotency_records WHERE expires_at < ?',
      [olderThan],
    );
    this.#conn.run('DELETE FROM idempotency_records WHERE expires_at < ?', [olderThan]);
    return before?.n ?? 0;
  }
}

interface IdempotencyRow {
  key: string;
  request_hash: string;
  status_code: number;
  response_json: string;
  response_headers_json: string | null;
  scope: string | null;
  created_at: number;
  expires_at: number;
}
