/**
 * High-level library functions used by the CLI surface (`graphorin
 * auth login | list | refresh | revoke | status`). Wrapping the
 * lower-level {@link OAuthClient} keeps the CLI thin and shareable
 * with the standalone server.
 *
 * @packageDocumentation
 */

import type { OAuthServerStore } from '@graphorin/core/contracts';

import { createOAuthClient } from './client.js';
import { listOAuthStrategies } from './strategies.js';
import type {
  AuthorizeCodeOptions,
  AuthorizeDeviceOptions,
  CreateOAuthClientOptions,
  OAuthClient,
  OAuthSession,
  OAuthSessionMetadata,
  OAuthStrategy,
} from './types.js';

/**
 * Options accepted by {@link loginInteractive}.
 *
 * @stable
 */
export interface LoginInteractiveOptions {
  /**
   * Secrets store the session tokens are persisted into (SPL-1) so the
   * login survives the process.
   */
  readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore;
  readonly serverId: string;
  readonly serverUrl: string;
  readonly storage: OAuthServerStore;
  /** Default `false` - Authorization Code is the default. */
  readonly deviceFlow?: boolean;
  /** Pre-existing client identifier; skips DCR when supplied. */
  readonly clientId?: string;
  readonly scope?: string;
  /** Forwarded to the chosen flow. */
  readonly authorizeCode?: AuthorizeCodeOptions;
  readonly authorizeDevice?: AuthorizeDeviceOptions;
  readonly metadata?: CreateOAuthClientOptions['metadata'];
}

/**
 * Result returned by {@link loginInteractive}.
 *
 * @stable
 */
export interface LoginInteractiveResult {
  readonly session: OAuthSession;
  readonly status: OAuthSessionMetadata;
  readonly client: OAuthClient;
}

/**
 * Drive an interactive login flow against the supplied server. The
 * function chooses Authorization Code by default and falls back to
 * the Device Authorization Grant when `deviceFlow: true`.
 *
 * @stable
 */
export async function loginInteractive(
  options: LoginInteractiveOptions,
): Promise<LoginInteractiveResult> {
  const clientArgs: CreateOAuthClientOptions = {
    serverId: options.serverId,
    serverUrl: options.serverUrl,
    storage: options.storage,
    ...(options.secretsStore === undefined ? {} : { secretsStore: options.secretsStore }),
    ...(options.metadata === undefined ? {} : { metadata: options.metadata }),
    ...(options.clientId === undefined
      ? {}
      : { registration: { clientId: options.clientId, registeredVia: 'manual' } }),
  };
  const client = createOAuthClient(clientArgs);
  const session =
    options.deviceFlow === true
      ? await client.authorizeDevice({
          ...(options.scope === undefined ? {} : { scope: options.scope }),
          ...(options.authorizeDevice ?? {}),
        })
      : await client.authorizeCode({
          ...(options.scope === undefined ? {} : { scope: options.scope }),
          ...(options.authorizeCode ?? {}),
        });
  const status = await client.status();
  if (status === null) {
    throw new Error(
      `loginInteractive succeeded but no session metadata was persisted for '${options.serverId}'.`,
    );
  }
  return { session, status, client };
}

/**
 * List the audit-safe metadata of every persisted OAuth session.
 *
 * @stable
 */
export async function listOAuthSessions(
  storage: OAuthServerStore,
  options: { readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore } = {},
): Promise<ReadonlyArray<OAuthSessionMetadata>> {
  const records = await storage.list();
  const resolves = async (ref: string | undefined, key: string): Promise<boolean> => {
    if (ref === undefined) return false;
    if (options.secretsStore === undefined) return true;
    return (await options.secretsStore.get(key)) !== null;
  };
  const now = Date.now();
  const out: OAuthSessionMetadata[] = [];
  for (const record of records) {
    let status: OAuthSessionMetadata['status'] = 'unknown';
    if (record.expiresAt !== undefined) {
      if (record.expiresAt < now) status = 'expired';
      else if (record.expiresAt - now < 5 * 60_000) status = 'expiring-soon';
      else status = 'fresh';
    }
    out.push(
      Object.freeze({
        serverId: record.id,
        serverUrl: record.serverUrl,
        clientId: record.clientId,
        ...(record.issuer === undefined ? {} : { issuer: record.issuer }),
        ...(record.scope === undefined ? {} : { scope: record.scope }),
        ...(record.expiresAt === undefined ? {} : { expiresAt: record.expiresAt }),
        ...(record.lastRefreshedAt === undefined
          ? {}
          : { lastRefreshedAt: record.lastRefreshedAt }),
        ...(record.registeredVia === undefined ? {} : { registeredVia: record.registeredVia }),
        hasAccessToken: await resolves(record.accessTokenRef, `oauth:${record.id}:access`),
        hasRefreshToken: await resolves(record.refreshTokenRef, `oauth:${record.id}:refresh`),
        status,
      }),
    );
  }
  return Object.freeze(out);
}

/**
 * Refresh the OAuth session for `serverId`. Throws when the session
 * has no refresh token or when the authorization server rejects the
 * refresh.
 *
 * @stable
 */
export async function refreshOAuthSession(
  storage: OAuthServerStore,
  serverId: string,
  options: {
    readonly signal?: AbortSignal;
    /** SPL-1: resolves the persisted refresh token across processes. */
    readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore;
  } = {},
): Promise<OAuthSession> {
  const record = await storage.get(serverId);
  if (record === null) throw new Error(`OAuth server '${serverId}' not found.`);
  const metadata = buildMetadataFromRecord(record);
  const client = createOAuthClient({
    serverId: record.id,
    serverUrl: record.serverUrl,
    storage,
    registration: { clientId: record.clientId },
    ...(metadata === undefined ? {} : { metadata }),
    ...(options.secretsStore === undefined ? {} : { secretsStore: options.secretsStore }),
  });
  return client.refresh({ ...(options.signal === undefined ? {} : { signal: options.signal }) });
}

/**
 * Revoke the OAuth session for `serverId`. The function always tears
 * the persisted record down even when the revocation endpoint
 * returns an error.
 *
 * @stable
 */
export async function revokeOAuthSession(
  storage: OAuthServerStore,
  serverId: string,
  options: {
    readonly reason?: string;
    readonly signal?: AbortSignal;
    /** SPL-1: resolves the persisted tokens so RFC 7009 actually fires. */
    readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore;
  } = {},
): Promise<void> {
  const record = await storage.get(serverId);
  if (record === null) return;
  const metadata = buildMetadataFromRecord(record);
  const client = createOAuthClient({
    serverId: record.id,
    serverUrl: record.serverUrl,
    storage,
    registration: { clientId: record.clientId },
    ...(metadata === undefined ? {} : { metadata }),
    ...(options.secretsStore === undefined ? {} : { secretsStore: options.secretsStore }),
  });
  await client.revoke({
    ...(options.reason === undefined ? {} : { reason: options.reason }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
}

function buildMetadataFromRecord(
  record: import('@graphorin/core/contracts').OAuthServerRecord,
): CreateOAuthClientOptions['metadata'] | undefined {
  if (record.tokenEndpoint === undefined || record.authorizationEndpoint === undefined) {
    return undefined;
  }
  const server: import('./types.js').OAuthServerMetadata = {
    issuer: record.issuer ?? record.serverUrl,
    authorizationEndpoint: record.authorizationEndpoint,
    tokenEndpoint: record.tokenEndpoint,
    ...(record.registrationEndpoint === undefined
      ? {}
      : { registrationEndpoint: record.registrationEndpoint }),
    ...(record.revocationEndpoint === undefined
      ? {}
      : { revocationEndpoint: record.revocationEndpoint }),
    ...(record.deviceAuthorizationEndpoint === undefined
      ? {}
      : { deviceAuthorizationEndpoint: record.deviceAuthorizationEndpoint }),
  };
  return Object.freeze({ server });
}

/**
 * Snapshot of the OAuth subsystem state. Used by `graphorin auth status`.
 *
 * @stable
 */
export interface OAuthStatusSnapshot {
  readonly sessions: ReadonlyArray<OAuthSessionMetadata>;
  readonly providers: ReadonlyArray<{ readonly id: string; readonly hasMatch: boolean }>;
  readonly defaultStrategy: OAuthStrategy | null;
}

/**
 * Build the snapshot returned by `graphorin auth status` (Phase 15).
 *
 * @stable
 */
export async function getOAuthStatus(
  storage: OAuthServerStore,
  options: { readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore } = {},
): Promise<OAuthStatusSnapshot> {
  const sessions = await listOAuthSessions(storage, options);
  const strategies = listOAuthStrategies();
  const providers = strategies.map((s) => Object.freeze({ id: s.id, hasMatch: true }));
  return Object.freeze({
    sessions,
    providers: Object.freeze(providers),
    defaultStrategy: strategies[0] ?? null,
  });
}
