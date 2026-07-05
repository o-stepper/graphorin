/**
 * Dynamic Client Registration (RFC 7591) - minimal client.
 *
 * The framework only needs the public-client subset (client_id +
 * optional client_secret) for the outbound MCP OAuth flow.
 *
 * @packageDocumentation
 */

import { SecretValue } from '../secrets/secret-value.js';
import { OAuthFlowAbortedError, OAuthRegistrationUnsupportedError } from './errors.js';
import type { DiscoveredMetadata, DynamicClientRegistrationResult } from './types.js';

/** Strategy hook used by tests to inject a synthetic registration response. */
export type DcrFetcher = (
  url: string,
  init: { body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; statusText?: string; json: () => Promise<unknown> }>;

let activeFetcher: DcrFetcher | null = null;

/**
 * Override the DCR fetcher. Used by the test suite.
 *
 * @experimental
 */
export function _setDcrFetcherForTesting(fetcher: DcrFetcher | null): void {
  activeFetcher = fetcher;
}

async function postJson(
  url: string,
  body: Readonly<Record<string, unknown>>,
  signal?: AbortSignal,
): Promise<{ ok: boolean; status: number; statusText?: string; json: () => Promise<unknown> }> {
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('registration');
  const payload = JSON.stringify(body);
  if (activeFetcher !== null) {
    return activeFetcher(url, {
      body: payload,
      ...(signal === undefined ? {} : { signal }),
    });
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: payload,
    ...(signal === undefined ? {} : { signal }),
  });
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    json: () => response.json() as Promise<unknown>,
  };
}

/**
 * Options accepted by {@link registerDynamicClient}.
 *
 * @stable
 */
export interface RegisterDynamicClientOptions {
  readonly clientName: string;
  readonly redirectUris?: ReadonlyArray<string>;
  readonly scope?: string;
  readonly grantTypes?: ReadonlyArray<string>;
  readonly tokenEndpointAuthMethod?: string;
  readonly applicationType?: 'native' | 'web';
  readonly extra?: Readonly<Record<string, unknown>>;
  readonly signal?: AbortSignal;
}

/**
 * Register a fresh OAuth client with the discovered authorization
 * server using RFC 7591.
 *
 * @stable
 */
export async function registerDynamicClient(
  metadata: DiscoveredMetadata,
  options: RegisterDynamicClientOptions,
): Promise<DynamicClientRegistrationResult> {
  const endpoint = metadata.server.registrationEndpoint;
  if (endpoint === undefined || endpoint === '') {
    throw new OAuthRegistrationUnsupportedError(metadata.server.issuer);
  }
  const body: Record<string, unknown> = {
    client_name: options.clientName,
    application_type: options.applicationType ?? 'native',
  };
  if (options.redirectUris !== undefined && options.redirectUris.length > 0) {
    body.redirect_uris = [...options.redirectUris];
  }
  if (options.scope !== undefined) body.scope = options.scope;
  if (options.grantTypes !== undefined && options.grantTypes.length > 0) {
    body.grant_types = [...options.grantTypes];
  }
  if (options.tokenEndpointAuthMethod !== undefined) {
    body.token_endpoint_auth_method = options.tokenEndpointAuthMethod;
  }
  if (options.extra !== undefined) Object.assign(body, options.extra);

  const response = await postJson(endpoint, body, options.signal);
  if (!response.ok) {
    throw new Error(
      `Dynamic Client Registration failed: ${response.status} ${response.statusText ?? ''}`.trim(),
    );
  }
  const raw = (await response.json()) as Record<string, unknown>;
  const clientId = raw.client_id;
  if (typeof clientId !== 'string' || clientId.length === 0) {
    throw new Error('Dynamic Client Registration response missing client_id.');
  }
  const clientSecret =
    typeof raw.client_secret === 'string' && raw.client_secret.length > 0
      ? SecretValue.fromString(raw.client_secret, {
          source: { resolver: 'oauth-dcr', ref: `oauth-dcr:${clientId}` },
        })
      : undefined;
  const issued = typeof raw.client_id_issued_at === 'number' ? raw.client_id_issued_at : undefined;
  const expires =
    typeof raw.client_secret_expires_at === 'number' ? raw.client_secret_expires_at : undefined;

  return Object.freeze({
    clientId,
    ...(clientSecret === undefined ? {} : { clientSecret }),
    ...(issued === undefined ? {} : { clientIdIssuedAt: issued }),
    ...(expires === undefined ? {} : { clientSecretExpiresAt: expires }),
    raw: Object.freeze({ ...raw }),
  });
}
