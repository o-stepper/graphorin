import type { OAuthServerRecord, OAuthServerStore } from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `OAuthServerStore` implementation. Persists OAuth
 * registration metadata + `SecretRef` URI strings; the actual token
 * material lives in `@graphorin/security`'s secret store and is
 * resolved by the URI at use time (DEC-139 / ADR-033).
 *
 * @stable
 */
export class SqliteOAuthServerStore implements OAuthServerStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async put(record: OAuthServerRecord): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO oauth_servers (
         id, server_url, authorization_endpoint, token_endpoint, registration_endpoint,
         revocation_endpoint, device_authorization_endpoint, issuer, client_id,
         client_secret_ref, access_token_ref, refresh_token_ref, id_token_ref,
         expires_at, scope, redirect_uri, registered_via, last_refreshed_at,
         last_refresh_error, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.serverUrl,
        record.authorizationEndpoint ?? null,
        record.tokenEndpoint ?? null,
        record.registrationEndpoint ?? null,
        record.revocationEndpoint ?? null,
        record.deviceAuthorizationEndpoint ?? null,
        record.issuer ?? null,
        record.clientId,
        record.clientSecretRef ?? null,
        record.accessTokenRef ?? null,
        record.refreshTokenRef ?? null,
        record.idTokenRef ?? null,
        record.expiresAt ?? null,
        record.scope ?? null,
        record.redirectUri ?? null,
        record.registeredVia ?? null,
        record.lastRefreshedAt ?? null,
        record.lastRefreshError ?? null,
        record.createdAt,
        record.updatedAt,
      ],
    );
  }

  async get(id: string): Promise<OAuthServerRecord | null> {
    const row = this.#conn.get<OAuthServerRow>('SELECT * FROM oauth_servers WHERE id = ?', [id]);
    return row ? rowToRecord(row) : null;
  }

  async list(): Promise<ReadonlyArray<OAuthServerRecord>> {
    const rows = this.#conn.all<OAuthServerRow>('SELECT * FROM oauth_servers ORDER BY id');
    return rows.map(rowToRecord);
  }

  async update(id: string, patch: Partial<OAuthServerRecord>): Promise<OAuthServerRecord> {
    const existing = await this.get(id);
    if (existing === null) {
      throw new Error(`[graphorin/store-sqlite] oauth server '${id}' not found`);
    }
    const merged: OAuthServerRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: Date.now(),
    };
    await this.put(merged);
    return merged;
  }

  async delete(id: string): Promise<void> {
    this.#conn.run('DELETE FROM oauth_servers WHERE id = ?', [id]);
  }
}

interface OAuthServerRow {
  id: string;
  server_url: string;
  authorization_endpoint: string | null;
  token_endpoint: string | null;
  registration_endpoint: string | null;
  revocation_endpoint: string | null;
  device_authorization_endpoint: string | null;
  issuer: string | null;
  client_id: string;
  client_secret_ref: string | null;
  access_token_ref: string | null;
  refresh_token_ref: string | null;
  id_token_ref: string | null;
  expires_at: number | null;
  scope: string | null;
  redirect_uri: string | null;
  registered_via: 'dcr' | 'manual' | null;
  last_refreshed_at: number | null;
  last_refresh_error: string | null;
  created_at: number;
  updated_at: number;
}

function rowToRecord(row: OAuthServerRow): OAuthServerRecord {
  return {
    id: row.id,
    serverUrl: row.server_url,
    ...(row.authorization_endpoint !== null
      ? { authorizationEndpoint: row.authorization_endpoint }
      : {}),
    ...(row.token_endpoint !== null ? { tokenEndpoint: row.token_endpoint } : {}),
    ...(row.registration_endpoint !== null
      ? { registrationEndpoint: row.registration_endpoint }
      : {}),
    ...(row.revocation_endpoint !== null ? { revocationEndpoint: row.revocation_endpoint } : {}),
    ...(row.device_authorization_endpoint !== null
      ? { deviceAuthorizationEndpoint: row.device_authorization_endpoint }
      : {}),
    ...(row.issuer !== null ? { issuer: row.issuer } : {}),
    clientId: row.client_id,
    ...(row.client_secret_ref !== null ? { clientSecretRef: row.client_secret_ref } : {}),
    ...(row.access_token_ref !== null ? { accessTokenRef: row.access_token_ref } : {}),
    ...(row.refresh_token_ref !== null ? { refreshTokenRef: row.refresh_token_ref } : {}),
    ...(row.id_token_ref !== null ? { idTokenRef: row.id_token_ref } : {}),
    ...(row.expires_at !== null ? { expiresAt: row.expires_at } : {}),
    ...(row.scope !== null ? { scope: row.scope } : {}),
    ...(row.redirect_uri !== null ? { redirectUri: row.redirect_uri } : {}),
    ...(row.registered_via !== null ? { registeredVia: row.registered_via } : {}),
    ...(row.last_refreshed_at !== null ? { lastRefreshedAt: row.last_refreshed_at } : {}),
    ...(row.last_refresh_error !== null ? { lastRefreshError: row.last_refresh_error } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
