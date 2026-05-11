import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `AuthTokenStore` implementation. Persists HMAC-SHA256 hashes
 * of issued server tokens (DEC-122 / ADR-027). Raw tokens are never
 * persisted — the runtime carries them via `SecretValue`.
 *
 * @stable
 */
export class SqliteAuthTokenStore implements AuthTokenStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(record: AuthTokenRecord): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO auth_tokens (
         id, hash_hex, label, scopes_json, created_at, expires_at, revoked_at, last_used_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.hashHex,
        record.label ?? null,
        JSON.stringify(record.scopes),
        Date.parse(record.createdAt),
        record.expiresAt ? Date.parse(record.expiresAt) : null,
        record.revokedAt ? Date.parse(record.revokedAt) : null,
        record.lastUsedAt ? Date.parse(record.lastUsedAt) : null,
      ],
    );
  }

  async get(id: string): Promise<AuthTokenRecord | null> {
    const row = this.#conn.get<AuthTokenRow>('SELECT * FROM auth_tokens WHERE id = ?', [id]);
    return row ? rowToRecord(row) : null;
  }

  async list(): Promise<ReadonlyArray<AuthTokenRecord>> {
    const rows = this.#conn.all<AuthTokenRow>('SELECT * FROM auth_tokens ORDER BY created_at');
    return rows.map(rowToRecord);
  }

  async revoke(id: string, revokedAt: string): Promise<void> {
    this.#conn.run('UPDATE auth_tokens SET revoked_at = ? WHERE id = ?', [
      Date.parse(revokedAt),
      id,
    ]);
  }

  async recordUse(id: string, usedAt: string): Promise<void> {
    this.#conn.run('UPDATE auth_tokens SET last_used_at = ? WHERE id = ?', [
      Date.parse(usedAt),
      id,
    ]);
  }
}

interface AuthTokenRow {
  id: string;
  hash_hex: string;
  label: string | null;
  scopes_json: string;
  created_at: number;
  expires_at: number | null;
  revoked_at: number | null;
  last_used_at: number | null;
}

function rowToRecord(row: AuthTokenRow): AuthTokenRecord {
  return {
    id: row.id,
    hashHex: row.hash_hex,
    ...(row.label !== null ? { label: row.label } : {}),
    scopes: JSON.parse(row.scopes_json),
    createdAt: new Date(row.created_at).toISOString(),
    ...(row.expires_at !== null ? { expiresAt: new Date(row.expires_at).toISOString() } : {}),
    ...(row.revoked_at !== null ? { revokedAt: new Date(row.revoked_at).toISOString() } : {}),
    ...(row.last_used_at !== null ? { lastUsedAt: new Date(row.last_used_at).toISOString() } : {}),
  };
}
