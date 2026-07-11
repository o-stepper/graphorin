/**
 * Bridge between the MCP transport's bearer-token requirement and the
 * outbound OAuth subsystem in `@graphorin/security/oauth`.
 *
 * The bridge resolves an authorization header from a stored
 * {@link OAuthSession}, refreshes the token automatically when it is
 * within the configured pre-expiry window, and surfaces every
 * lifecycle transition (`oauth.granted` / `oauth.refreshed` /
 * `oauth.revoked` / `mcp.auth.expired`) to subscribers.
 *
 * @packageDocumentation
 */

import type { OAuthServerRecord, OAuthServerStore } from '@graphorin/core/contracts';
import type { OAuthSession } from '@graphorin/security/oauth';
import {
  emitOAuthLifecycle,
  GraphorinOAuthError,
  refreshOAuthSession,
} from '@graphorin/security/oauth';
import { SecretValue } from '@graphorin/security/secrets';

import { MCPAuthError } from '../errors/index.js';

/** Options accepted by {@link createOAuthAuthorizationProvider}. */
export interface OAuthAuthorizationProviderOptions {
  /**
   * Secrets store the persisted tokens resolve from (SPL-1) - with it,
   * the bridge issues Authorization headers across process restarts.
   */
  readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore;
  /** Stable identifier of the persisted OAuth server (`serverId`). */
  readonly serverId: string;
  /** Persistent storage. */
  readonly storage: OAuthServerStore;
  /**
   * Time-to-refresh window in milliseconds. When the session is
   * within `refreshAheadMs` of expiry the provider triggers a
   * refresh on the next request. Defaults to 5 minutes.
   */
  readonly refreshAheadMs?: number;
  /** Optional per-request `AbortSignal` (forwarded to refresh). */
  readonly signal?: AbortSignal;
}

/**
 * Live authorization-header provider returned by
 * {@link createOAuthAuthorizationProvider}.
 *
 * @stable
 */
export interface OAuthAuthorizationProvider {
  /** Resolve an `Authorization: Bearer ...` header. */
  resolveHeader(): Promise<string>;
  /** Force a refresh, regardless of expiry. */
  refresh(): Promise<OAuthSession>;
  /** Persist the most recently observed expiry timestamp. */
  readonly serverId: string;
}

/**
 * Build a provider that resolves the `Authorization` header value the
 * Streamable HTTP / SSE MCP transports send on every request.
 *
 * The provider:
 *
 * 1. Loads the persisted session metadata from the supplied store.
 * 2. Refreshes the session when it is within `refreshAheadMs` of
 *    expiry.
 * 3. Wraps every refresh failure in {@link MCPAuthError} carrying a
 *    `hint` that points the operator to the upcoming
 *    `graphorin auth refresh` CLI.
 *
 * @stable
 */
export function createOAuthAuthorizationProvider(
  options: OAuthAuthorizationProviderOptions,
): OAuthAuthorizationProvider {
  const refreshAheadMs = options.refreshAheadMs ?? 5 * 60_000;
  let activeSession: OAuthSession | undefined;

  // Rehydrate the persisted access token instead of refreshing: every
  // rotation-hostile refresh burnt on process restart can invalidate a
  // concurrent consumer of the same (single-use) refresh token. The
  // token lives in the secrets store under the scheme-stripped key the
  // OAuth client persists it with (SPL-1, `keyring:oauth:<id>:access`).
  async function loadPersistedSession(record: OAuthServerRecord): Promise<OAuthSession | null> {
    if (options.secretsStore === undefined || record.accessTokenRef === undefined) return null;
    const stored = await options.secretsStore.get(`oauth:${options.serverId}:access`);
    if (stored === null) return null;
    // Rewrap into the security-level SecretValue the OAuthSession
    // contract requires (same normalization the OAuth client applies).
    const accessToken = SecretValue.fromString(await stored.use((v) => v));
    return Object.freeze({
      serverId: options.serverId,
      accessToken,
      tokenType: 'Bearer',
      ...(record.scope === undefined ? {} : { scope: record.scope }),
      ...(record.expiresAt === undefined ? {} : { expiresAt: record.expiresAt }),
      issuedAt: record.lastRefreshedAt ?? record.createdAt,
    });
  }

  async function loadOrRefresh(force: boolean): Promise<OAuthSession> {
    const record = await options.storage.get(options.serverId);
    if (record === null) {
      throw new MCPAuthError(`OAuth server '${options.serverId}' is not registered.`, {
        hint: `run 'graphorin auth login --mcp ${options.serverId} --url <server-url>' to register the OAuth server.`,
        metadata: { server: options.serverId },
      });
    }
    const expiresAt = record.expiresAt;
    const now = Date.now();
    const stale = force || (expiresAt !== undefined && expiresAt - now < refreshAheadMs);
    if (!stale && activeSession !== undefined) return activeSession;
    if (!stale && expiresAt !== undefined) {
      // The stored session is provably fresh - serve the persisted
      // token; fall through to a refresh only when it cannot be
      // resolved (no secrets store / token missing).
      const persisted = await loadPersistedSession(record);
      if (persisted !== null) {
        activeSession = persisted;
        return persisted;
      }
    }
    try {
      const session = await refreshOAuthSession(options.storage, options.serverId, {
        ...(options.signal === undefined ? {} : { signal: options.signal }),
        ...(options.secretsStore === undefined ? {} : { secretsStore: options.secretsStore }),
      });
      activeSession = session;
      return session;
    } catch (cause) {
      if (cause instanceof GraphorinOAuthError) {
        emitOAuthLifecycle({
          type: 'mcp.auth.expired',
          serverId: options.serverId,
          ts: Date.now(),
          reason: cause.kind,
          metadata: { serverUrl: record.serverUrl },
        });
        throw new MCPAuthError(
          `MCP OAuth session for '${options.serverId}' could not be refreshed: ${cause.message}`,
          {
            hint: `run 'graphorin auth refresh --mcp ${options.serverId}' to recover.`,
            metadata: { server: options.serverId },
            cause,
          },
        );
      }
      throw new MCPAuthError(
        `MCP OAuth session for '${options.serverId}' could not be refreshed.`,
        {
          hint: `run 'graphorin auth refresh --mcp ${options.serverId}' to recover.`,
          metadata: { server: options.serverId },
          cause,
        },
      );
    }
  }

  return Object.freeze({
    serverId: options.serverId,
    async resolveHeader(): Promise<string> {
      const session = await loadOrRefresh(false);
      const tokenType = session.tokenType.length === 0 ? 'Bearer' : session.tokenType;
      return session.accessToken.use((raw) => `${tokenType} ${raw}`);
    },
    async refresh(): Promise<OAuthSession> {
      return loadOrRefresh(true);
    },
  });
}
