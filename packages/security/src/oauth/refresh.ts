/**
 * Refresh-token grant + revocation helpers.
 *
 * The refresh helper de-duplicates concurrent calls per server-id so
 * 10 simultaneous `client.refresh()` invocations result in a single
 * HTTP round-trip. All callers observe the same resolved session.
 *
 * @packageDocumentation
 */

import type { SecretValue } from '../secrets/secret-value.js';
import { buildOAuthSession } from './authorize-code-flow.js';
import { OAuthFlowAbortedError, OAuthRefreshError, OAuthRevokedError } from './errors.js';
import { encodeBasicAuth, postToTokenEndpoint } from './token-endpoint.js';
import type { DiscoveredMetadata, OAuthRegistration, OAuthSession } from './types.js';

const inflight = new Map<string, Promise<OAuthSession>>();

/** Internal arguments for the refresh helper. */
export interface RefreshAccessTokenArgs {
  readonly serverId: string;
  readonly metadata: DiscoveredMetadata;
  readonly registration: OAuthRegistration;
  readonly refreshToken: SecretValue;
  readonly scope?: string;
  readonly signal?: AbortSignal;
  /**
   * When `true` and the authorization server **rotates** the refresh
   * token (RFC 6749 §10.4 / OAuth 2.1 — the token response carries a
   * *different* `refresh_token`), best-effort revoke the previous
   * refresh token via {@link revokeOAuthToken}. Defaults to `false` so
   * existing callers are unaffected; servers that already invalidate
   * the old token on rotation make this a defense-in-depth no-op.
   * Revocation failures never fail the refresh.
   */
  readonly revokePreviousOnRotation?: boolean;
  /**
   * Bypass the in-flight dedupe (SPL-12): a forced refresh always
   * issues a fresh token-endpoint request instead of joining the
   * shared in-flight promise.
   */
  readonly force?: boolean;
}

/**
 * Refresh the access token. Identical concurrent invocations share a
 * single in-flight request; subsequent callers observe the same
 * resolved session.
 *
 * @stable
 */
export function refreshAccessToken(args: RefreshAccessTokenArgs): Promise<OAuthSession> {
  const cached = args.force === true ? undefined : inflight.get(args.serverId);
  if (cached !== undefined) return cached;
  const promise = doRefresh(args).finally(() => {
    if (inflight.get(args.serverId) === promise) inflight.delete(args.serverId);
  });
  inflight.set(args.serverId, promise);
  return promise;
}

/**
 * Reset the inflight refresh map. Used by tests.
 *
 * @experimental
 */
export function _resetInflightRefreshForTesting(): void {
  inflight.clear();
}

/**
 * Snapshot of the current inflight set. Used by tests.
 *
 * @experimental
 */
export function _getInflightRefreshKeysForTesting(): ReadonlyArray<string> {
  return Object.freeze([...inflight.keys()]);
}

async function doRefresh(args: RefreshAccessTokenArgs): Promise<OAuthSession> {
  const { serverId, metadata, registration, refreshToken } = args;
  if (args.signal?.aborted === true) throw new OAuthFlowAbortedError('callback');

  const params: Record<string, string> = {
    grant_type: 'refresh_token',
    client_id: registration.clientId,
    refresh_token: refreshToken.reveal(),
  };
  if (args.scope !== undefined) params.scope = args.scope;

  let basic: string | undefined;
  if (registration.clientSecret !== undefined) {
    basic = encodeBasicAuth(registration.clientId, registration.clientSecret.reveal());
  }
  const response = await postToTokenEndpoint(metadata.server.tokenEndpoint, params, {
    ...(args.signal === undefined ? {} : { signal: args.signal }),
    ...(basic === undefined ? {} : { basicAuth: basic }),
  });
  if (!response.ok || response.body.error !== undefined) {
    const error = response.body.error ?? `http_${response.status}`;
    if (error === 'invalid_grant' || error === 'invalid_token') {
      throw new OAuthRevokedError(serverId, error);
    }
    throw new OAuthRefreshError(serverId, error, response.body.error_description ?? error);
  }
  const session = buildOAuthSession(serverId, response.body);

  // Refresh-token rotation (RFC 6749 §10.4 / OAuth 2.1): when the
  // server hands back a *different* refresh token, the previous one
  // should be retired. Opt-in + best-effort — a revocation failure
  // must not fail the refresh the caller is awaiting.
  if (args.revokePreviousOnRotation === true && session.refreshToken !== undefined) {
    const rotated = session.refreshToken.reveal() !== refreshToken.reveal();
    if (rotated) {
      await revokeOAuthToken({
        serverId,
        metadata,
        registration,
        token: refreshToken,
        tokenTypeHint: 'refresh_token',
        ...(args.signal === undefined ? {} : { signal: args.signal }),
      }).catch((err: unknown) => {
        void err;
      });
    }
  }

  return session;
}

/** Strategy hook used by tests to stub the revoke request. */
export type RevocationFetcher = (
  url: string,
  init: { body: string; signal?: AbortSignal; basicAuth?: string },
) => Promise<{ ok: boolean; status: number; statusText?: string }>;

let activeRevocationFetcher: RevocationFetcher | null = null;

/**
 * Override the revocation fetcher. Used by the test suite.
 *
 * @experimental
 */
export function _setRevocationFetcherForTesting(fetcher: RevocationFetcher | null): void {
  activeRevocationFetcher = fetcher;
}

/** Internal arguments for the revoke helper. */
export interface RevokeOAuthTokenArgs {
  readonly serverId: string;
  readonly metadata: DiscoveredMetadata;
  readonly registration: OAuthRegistration;
  readonly token: SecretValue;
  readonly tokenTypeHint?: 'access_token' | 'refresh_token';
  readonly signal?: AbortSignal;
}

/**
 * Revoke an OAuth token via RFC 7009. Honest failure semantics
 * (SPL-1 / SPL-16): a missing revocation endpoint, a network failure,
 * and a non-2xx response all **throw** — the caller decides whether
 * teardown proceeds, and the audit trail never claims a server-side
 * revocation that was not confirmed.
 *
 * @stable
 */
export async function revokeOAuthToken(args: RevokeOAuthTokenArgs): Promise<void> {
  const endpoint = args.metadata.server.revocationEndpoint;
  if (endpoint === undefined || endpoint === '') {
    throw new Error(
      `OAuth server for '${args.serverId}' advertises no revocation endpoint; ` +
        'the token cannot be revoked server-side.',
    );
  }
  if (args.signal?.aborted === true) throw new OAuthFlowAbortedError('callback');

  const params: Record<string, string> = {
    client_id: args.registration.clientId,
    token: args.token.reveal(),
  };
  if (args.tokenTypeHint !== undefined) params.token_type_hint = args.tokenTypeHint;

  let basic: string | undefined;
  if (args.registration.clientSecret !== undefined) {
    basic = encodeBasicAuth(args.registration.clientId, args.registration.clientSecret.reveal());
  }
  const body = encodeForm(params);
  if (activeRevocationFetcher !== null) {
    const result = await activeRevocationFetcher(endpoint, {
      body,
      ...(args.signal === undefined ? {} : { signal: args.signal }),
      ...(basic === undefined ? {} : { basicAuth: basic }),
    });
    if (result !== undefined && result.ok === false) {
      throw new Error(`RFC 7009 revocation failed with HTTP ${result.status}.`);
    }
    return;
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };
  if (basic !== undefined) headers.Authorization = `Basic ${basic}`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
    ...(args.signal === undefined ? {} : { signal: args.signal }),
  });
  if (!resp.ok) {
    throw new Error(`RFC 7009 revocation failed with HTTP ${resp.status}.`);
  }
}

function encodeForm(params: Readonly<Record<string, string>>): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    out.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return out.join('&');
}
