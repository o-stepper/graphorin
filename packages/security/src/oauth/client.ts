/**
 * `createOAuthClient(...)` factory and the `OAuthClient` runtime.
 *
 * Wires the discovery / DCR / authorization / refresh / revoke
 * subsystems into a single object that callers can use without
 * touching the lower-level helpers.
 *
 * @packageDocumentation
 */

import type { OAuthServerRecord, OAuthServerStore } from '@graphorin/core/contracts';
import type { SecretValue } from '../secrets/secret-value.js';
import { emitOAuthAudit, type OAuthAuditAction, type OAuthAuditActor } from './audit-emitter.js';
import { runAuthorizationCodeFlow } from './authorize-code-flow.js';
import { runDeviceAuthorizationFlow } from './authorize-device-flow.js';
import { discoverMetadata } from './discovery.js';
import { registerDynamicClient } from './dynamic-client-registration.js';
import { emitOAuthLifecycle } from './events.js';
import { refreshAccessToken, revokeOAuthToken } from './refresh.js';
import { findOAuthStrategies } from './strategies.js';
import type {
  CreateOAuthClientOptions,
  DiscoveredMetadata,
  DynamicClientRegistrationResult,
  OAuthClient,
  OAuthRegistration,
  OAuthSession,
  OAuthSessionMetadata,
} from './types.js';

/** Default refresh-ahead window. */
const DEFAULT_REFRESH_AHEAD_MS = 5 * 60_000;

/**
 * Create an {@link OAuthClient}. The factory does not perform any
 * network I/O until one of the methods on the returned client is
 * called.
 *
 * @stable
 */
export function createOAuthClient(options: CreateOAuthClientOptions): OAuthClient {
  const refreshAheadMs = options.refreshAheadMs ?? DEFAULT_REFRESH_AHEAD_MS;
  const inMemoryAccess = new Map<string, SecretValue>();
  const inMemoryRefresh = new Map<string, SecretValue>();
  const inMemoryId = new Map<string, SecretValue>();

  let cachedMetadata: DiscoveredMetadata | undefined = options.metadata;
  let cachedRegistration: OAuthRegistration | undefined = options.registration;
  void refreshAheadMs;

  const log = options.logger ?? noopLogger;

  const ensureMetadata = async (signal?: AbortSignal): Promise<DiscoveredMetadata> => {
    if (cachedMetadata !== undefined) return cachedMetadata;
    cachedMetadata = await discoverMetadata(options.serverUrl, signal);
    return cachedMetadata;
  };

  const ensureRegistration = async (
    signal: AbortSignal | undefined,
    overrides?: { clientName?: string; redirectUris?: ReadonlyArray<string>; scope?: string },
  ): Promise<OAuthRegistration> => {
    if (cachedRegistration !== undefined) return cachedRegistration;
    const persisted = await options.storage.get(options.serverId);
    if (persisted !== null && persisted.clientId.length > 0) {
      cachedRegistration = {
        clientId: persisted.clientId,
        ...(persisted.registeredVia === undefined
          ? {}
          : { registeredVia: persisted.registeredVia }),
      };
      return cachedRegistration;
    }
    // Fall through to DCR.
    const metadata = await ensureMetadata(signal);
    const dcrOptions: {
      clientName: string;
      signal?: AbortSignal;
      redirectUris?: ReadonlyArray<string>;
      scope?: string;
    } = {
      clientName: overrides?.clientName ?? `graphorin/${options.serverId}`,
    };
    if (signal !== undefined) dcrOptions.signal = signal;
    if (overrides?.redirectUris !== undefined) dcrOptions.redirectUris = overrides.redirectUris;
    if (overrides?.scope !== undefined) dcrOptions.scope = overrides.scope;
    const result = await registerDynamicClient(metadata, dcrOptions);
    cachedRegistration = {
      clientId: result.clientId,
      ...(result.clientSecret === undefined ? {} : { clientSecret: result.clientSecret }),
      registeredVia: 'dcr',
      clientName: dcrOptions.clientName,
    };
    await persistRegistration(
      options.storage,
      options.serverId,
      options.serverUrl,
      cachedRegistration,
      metadata,
    );
    emitOAuthAudit({
      action: 'oauth:registered',
      decision: 'success',
      ts: Date.now(),
      source: 'oauth',
      target: `mcp:${options.serverId}`,
      metadata: {
        clientId: result.clientId,
        registeredVia: 'dcr',
      },
    });
    emitOAuthLifecycle({
      type: 'oauth.registered',
      serverId: options.serverId,
      ts: Date.now(),
      metadata: { clientId: result.clientId, registrationKind: 'dcr' },
    });
    return cachedRegistration;
  };

  const persistSession = async (session: OAuthSession): Promise<void> => {
    inMemoryAccess.set(options.serverId, session.accessToken);
    if (session.refreshToken !== undefined) {
      inMemoryRefresh.set(options.serverId, session.refreshToken);
    }
    if (session.idToken !== undefined) inMemoryId.set(options.serverId, session.idToken);
    const baseRecord: OAuthServerRecord = {
      id: options.serverId,
      serverUrl: options.serverUrl,
      clientId: cachedRegistration?.clientId ?? '',
      ...(cachedMetadata?.server.issuer === undefined
        ? {}
        : { issuer: cachedMetadata.server.issuer }),
      ...(cachedMetadata?.server.authorizationEndpoint === undefined
        ? {}
        : { authorizationEndpoint: cachedMetadata.server.authorizationEndpoint }),
      ...(cachedMetadata?.server.tokenEndpoint === undefined
        ? {}
        : { tokenEndpoint: cachedMetadata.server.tokenEndpoint }),
      ...(cachedMetadata?.server.registrationEndpoint === undefined
        ? {}
        : { registrationEndpoint: cachedMetadata.server.registrationEndpoint }),
      ...(cachedMetadata?.server.revocationEndpoint === undefined
        ? {}
        : { revocationEndpoint: cachedMetadata.server.revocationEndpoint }),
      ...(cachedMetadata?.server.deviceAuthorizationEndpoint === undefined
        ? {}
        : {
            deviceAuthorizationEndpoint: cachedMetadata.server.deviceAuthorizationEndpoint,
          }),
      ...(cachedRegistration?.registeredVia === undefined
        ? {}
        : { registeredVia: cachedRegistration.registeredVia }),
      accessTokenRef: `keyring:oauth:${options.serverId}:access`,
      ...(session.refreshToken === undefined
        ? {}
        : { refreshTokenRef: `keyring:oauth:${options.serverId}:refresh` }),
      ...(session.idToken === undefined
        ? {}
        : { idTokenRef: `keyring:oauth:${options.serverId}:id` }),
      ...(session.expiresAt === undefined ? {} : { expiresAt: session.expiresAt }),
      ...(session.scope === undefined ? {} : { scope: session.scope }),
      lastRefreshedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const existing = await options.storage.get(options.serverId);
    if (existing === null) {
      await options.storage.put(baseRecord);
    } else {
      await options.storage.update(options.serverId, {
        ...baseRecord,
        createdAt: existing.createdAt,
      });
    }
  };

  const handleStrategyHooks = async (
    kind: 'rotation' | 'failure',
    payload: Record<string, unknown>,
  ): Promise<void> => {
    const matched = findOAuthStrategies({
      serverId: options.serverId,
      serverUrl: options.serverUrl,
    });
    for (const strategy of matched) {
      try {
        if (kind === 'rotation' && strategy.onTokenRotation !== undefined) {
          await strategy.onTokenRotation(payload as never);
        } else if (kind === 'failure' && strategy.onRefreshFailure !== undefined) {
          await strategy.onRefreshFailure(payload as never);
        }
      } catch (err) {
        log('warn', `OAuth strategy '${strategy.id}' threw during ${kind}`, { error: String(err) });
      }
    }
  };

  const recordAudit = (
    action: OAuthAuditAction,
    decision: 'success' | 'denied' | 'error',
    metadata?: Readonly<Record<string, unknown>>,
    actor?: OAuthAuditActor,
  ): void => {
    emitOAuthAudit({
      action,
      decision,
      ts: Date.now(),
      source: 'oauth',
      target: `mcp:${options.serverId}`,
      ...(actor === undefined ? {} : { actor }),
      ...(metadata === undefined ? {} : { metadata }),
    });
  };

  return {
    serverId: options.serverId,
    serverUrl: options.serverUrl,
    get registration() {
      return cachedRegistration;
    },
    get metadata() {
      return cachedMetadata;
    },
    async discover(opts) {
      if (opts?.force === true) cachedMetadata = undefined;
      return ensureMetadata(opts?.signal);
    },
    async registerClient(opts) {
      const metadata = await ensureMetadata(opts?.signal);
      const dcrArgs: {
        clientName: string;
        signal?: AbortSignal;
        redirectUris?: ReadonlyArray<string>;
        scope?: string;
      } = {
        clientName: opts?.clientName ?? `graphorin/${options.serverId}`,
      };
      if (opts?.signal !== undefined) dcrArgs.signal = opts.signal;
      if (opts?.redirectUris !== undefined) dcrArgs.redirectUris = opts.redirectUris;
      if (opts?.scope !== undefined) dcrArgs.scope = opts.scope;
      const result: DynamicClientRegistrationResult = await registerDynamicClient(
        metadata,
        dcrArgs,
      );
      cachedRegistration = {
        clientId: result.clientId,
        ...(result.clientSecret === undefined ? {} : { clientSecret: result.clientSecret }),
        registeredVia: 'dcr',
        clientName: dcrArgs.clientName,
      };
      await persistRegistration(
        options.storage,
        options.serverId,
        options.serverUrl,
        cachedRegistration,
        metadata,
      );
      recordAudit('oauth:registered', 'success', {
        clientId: result.clientId,
        registeredVia: 'dcr',
      });
      emitOAuthLifecycle({
        type: 'oauth.registered',
        serverId: options.serverId,
        ts: Date.now(),
        metadata: { clientId: result.clientId, registrationKind: 'dcr' },
      });
      return result;
    },
    async authorizeCode(opts = {}) {
      const metadata = await ensureMetadata(opts.signal);
      const registration = await ensureRegistration(opts.signal, {
        ...(opts.scope === undefined ? {} : { scope: opts.scope }),
      });
      try {
        const session = await runAuthorizationCodeFlow({
          serverId: options.serverId,
          metadata,
          registration,
          options: opts,
        });
        await persistSession(session);
        recordAudit('oauth:granted', 'success', {
          scopes: session.scope?.split(/\s+/u) ?? [],
          ...(session.expiresAt === undefined ? {} : { expiresAt: session.expiresAt }),
          flow: 'authorization-code',
          registrationKind: registration.registeredVia ?? 'manual',
        });
        emitOAuthLifecycle({
          type: 'oauth.granted',
          serverId: options.serverId,
          ts: Date.now(),
          metadata: { flow: 'authorization-code' },
        });
        return session;
      } catch (err) {
        recordAudit('oauth:granted', 'error', { error: String(err) });
        throw err;
      }
    },
    async authorizeDevice(opts = {}) {
      const metadata = await ensureMetadata(opts.signal);
      const registration = await ensureRegistration(opts.signal, {
        ...(opts.scope === undefined ? {} : { scope: opts.scope }),
      });
      try {
        const session = await runDeviceAuthorizationFlow({
          serverId: options.serverId,
          metadata,
          registration,
          options: opts,
        });
        await persistSession(session);
        recordAudit('oauth:granted', 'success', {
          scopes: session.scope?.split(/\s+/u) ?? [],
          ...(session.expiresAt === undefined ? {} : { expiresAt: session.expiresAt }),
          flow: 'device-code',
          registrationKind: registration.registeredVia ?? 'manual',
        });
        emitOAuthLifecycle({
          type: 'oauth.granted',
          serverId: options.serverId,
          ts: Date.now(),
          metadata: { flow: 'device-code' },
        });
        return session;
      } catch (err) {
        recordAudit('oauth:granted', 'error', { error: String(err) });
        throw err;
      }
    },
    async refresh(opts) {
      const metadata = await ensureMetadata(opts?.signal);
      const registration = await ensureRegistration(opts?.signal);
      const refreshToken = inMemoryRefresh.get(options.serverId);
      if (refreshToken === undefined) {
        recordAudit('oauth:expired', 'denied', { reason: 'no_refresh_token' });
        emitOAuthLifecycle({
          type: 'mcp.auth.expired',
          serverId: options.serverId,
          ts: Date.now(),
          reason: 'no_refresh_token',
        });
        throw new Error(
          `OAuth client for '${options.serverId}' has no refresh token; run loginInteractive first.`,
        );
      }
      const previousScope = (await options.storage.get(options.serverId))?.scope;
      try {
        const session = await refreshAccessToken({
          serverId: options.serverId,
          metadata,
          registration,
          refreshToken,
          ...(opts?.signal === undefined ? {} : { signal: opts.signal }),
          ...(previousScope === undefined ? {} : { scope: previousScope }),
        });
        void opts?.force;
        await persistSession(session);
        recordAudit('oauth:refreshed', 'success', {
          ...(session.expiresAt === undefined ? {} : { expiresAt: session.expiresAt }),
          ...(session.scope === undefined ? {} : { scope: session.scope }),
        });
        emitOAuthLifecycle({
          type: 'oauth.refreshed',
          serverId: options.serverId,
          ts: Date.now(),
        });
        await handleStrategyHooks('rotation', {
          serverId: options.serverId,
          serverUrl: options.serverUrl,
          ...(previousScope === undefined ? {} : { previousScope }),
          ...(session.scope === undefined ? {} : { nextScope: session.scope }),
          issuedAt: session.issuedAt,
        });
        return session;
      } catch (err) {
        recordAudit('oauth:expired', 'error', { error: String(err) });
        emitOAuthLifecycle({
          type: 'mcp.auth.expired',
          serverId: options.serverId,
          ts: Date.now(),
          reason: String((err as { kind?: string }).kind ?? 'refresh-failed'),
        });
        await handleStrategyHooks('failure', {
          serverId: options.serverId,
          serverUrl: options.serverUrl,
          reason: String((err as { kind?: string }).kind ?? 'refresh-failed'),
          attemptedAt: Date.now(),
        });
        throw err;
      }
    },
    async revoke(opts) {
      const metadata = await ensureMetadata(opts?.signal);
      const registration = await ensureRegistration(opts?.signal);
      const refreshToken = inMemoryRefresh.get(options.serverId);
      const accessToken = inMemoryAccess.get(options.serverId);
      const tokenToRevoke = refreshToken ?? accessToken;
      try {
        if (tokenToRevoke !== undefined) {
          const revokeArgs: {
            serverId: string;
            metadata: DiscoveredMetadata;
            registration: OAuthRegistration;
            token: SecretValue;
            signal?: AbortSignal;
            tokenTypeHint?: 'access_token' | 'refresh_token';
          } = {
            serverId: options.serverId,
            metadata,
            registration,
            token: tokenToRevoke,
            tokenTypeHint: refreshToken === undefined ? 'access_token' : 'refresh_token',
          };
          if (opts?.signal !== undefined) revokeArgs.signal = opts.signal;
          await revokeOAuthToken(revokeArgs);
        }
        inMemoryAccess.delete(options.serverId);
        inMemoryRefresh.delete(options.serverId);
        inMemoryId.delete(options.serverId);
        await options.storage.delete(options.serverId);
        recordAudit('oauth:revoked', 'success', {
          ...(opts?.reason === undefined ? {} : { reason: opts.reason }),
        });
        emitOAuthLifecycle({
          type: 'oauth.revoked',
          serverId: options.serverId,
          ts: Date.now(),
          ...(opts?.reason === undefined ? {} : { reason: opts.reason }),
        });
      } catch (err) {
        recordAudit('oauth:revoked', 'error', { error: String(err) });
        throw err;
      }
    },
    async status() {
      const stored = await options.storage.get(options.serverId);
      if (stored === null) return null;
      const now = Date.now();
      const expiresAt = stored.expiresAt;
      let status: OAuthSessionMetadata['status'] = 'unknown';
      if (expiresAt !== undefined) {
        if (expiresAt < now) status = 'expired';
        else if (expiresAt - now < refreshAheadMs) status = 'expiring-soon';
        else status = 'fresh';
      }
      return Object.freeze({
        serverId: stored.id,
        serverUrl: stored.serverUrl,
        clientId: stored.clientId,
        ...(stored.issuer === undefined ? {} : { issuer: stored.issuer }),
        ...(stored.scope === undefined ? {} : { scope: stored.scope }),
        ...(stored.expiresAt === undefined ? {} : { expiresAt: stored.expiresAt }),
        ...(stored.lastRefreshedAt === undefined
          ? {}
          : { lastRefreshedAt: stored.lastRefreshedAt }),
        ...(stored.registeredVia === undefined ? {} : { registeredVia: stored.registeredVia }),
        hasAccessToken: stored.accessTokenRef !== undefined,
        hasRefreshToken: stored.refreshTokenRef !== undefined,
        status,
      });
    },
  };
}

async function persistRegistration(
  storage: OAuthServerStore,
  serverId: string,
  serverUrl: string,
  registration: OAuthRegistration,
  metadata: DiscoveredMetadata | undefined,
): Promise<void> {
  const existing = await storage.get(serverId);
  const now = Date.now();
  const record: OAuthServerRecord = {
    id: serverId,
    serverUrl,
    clientId: registration.clientId,
    ...(registration.registeredVia === undefined
      ? {}
      : { registeredVia: registration.registeredVia }),
    ...(registration.clientSecret === undefined
      ? {}
      : { clientSecretRef: `keyring:oauth:${serverId}:client_secret` }),
    ...(metadata?.server.issuer === undefined ? {} : { issuer: metadata.server.issuer }),
    ...(metadata?.server.authorizationEndpoint === undefined
      ? {}
      : { authorizationEndpoint: metadata.server.authorizationEndpoint }),
    ...(metadata?.server.tokenEndpoint === undefined
      ? {}
      : { tokenEndpoint: metadata.server.tokenEndpoint }),
    ...(metadata?.server.registrationEndpoint === undefined
      ? {}
      : { registrationEndpoint: metadata.server.registrationEndpoint }),
    ...(metadata?.server.revocationEndpoint === undefined
      ? {}
      : { revocationEndpoint: metadata.server.revocationEndpoint }),
    ...(metadata?.server.deviceAuthorizationEndpoint === undefined
      ? {}
      : {
          deviceAuthorizationEndpoint: metadata.server.deviceAuthorizationEndpoint,
        }),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing === null) {
    await storage.put(record);
  } else {
    await storage.update(serverId, record);
  }
}

function noopLogger(): void {
  // intentional
}
