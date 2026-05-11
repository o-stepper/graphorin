/**
 * Authorization-server + protected-resource metadata discovery.
 * Implements the subset of RFC 8414 (Authorization Server Metadata)
 * and RFC 9728 (Protected Resource Metadata) required by the
 * outbound MCP OAuth flow.
 *
 * The implementation uses Node's global `fetch` so the framework does
 * not pull a transport library into the security package. A test
 * fetcher can be injected via {@link _setDiscoveryFetcherForTesting}.
 *
 * @packageDocumentation
 */

import { OAuthDiscoveryError, OAuthFlowAbortedError } from './errors.js';
import type {
  DiscoveredMetadata,
  OAuthServerMetadata,
  ProtectedResourceMetadata,
} from './types.js';

/** Strategy hook used by tests so the unit suite never hits the network. */
export type DiscoveryFetcher = (
  url: string,
  init: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

let activeFetcher: DiscoveryFetcher | null = null;

/**
 * Override the discovery fetcher. Used by the test suite to inject
 * synthetic metadata documents.
 *
 * @experimental
 */
export function _setDiscoveryFetcherForTesting(fetcher: DiscoveryFetcher | null): void {
  activeFetcher = fetcher;
}

async function runFetch(
  url: string,
  signal?: AbortSignal,
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('discovery');
  if (activeFetcher !== null)
    return activeFetcher(url, { ...(signal === undefined ? {} : { signal }) });
  const response = await fetch(url, signal === undefined ? {} : { signal });
  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json() as Promise<unknown>,
  };
}

/**
 * Resolve full discovery metadata for `serverUrl`. The pipeline
 * tries the protected-resource metadata first (RFC 9728), then falls
 * back to the authorization-server metadata directly (RFC 8414 +
 * OpenID Connect Discovery).
 *
 * @stable
 */
export async function discoverMetadata(
  serverUrl: string,
  signal?: AbortSignal,
): Promise<DiscoveredMetadata> {
  const resource = await tryProtectedResourceMetadata(serverUrl, signal);
  if (resource !== undefined && resource.authorizationServers.length > 0) {
    const issuer = resource.authorizationServers[0];
    if (issuer === undefined) {
      throw new OAuthDiscoveryError(
        serverUrl,
        'Protected-resource metadata listed no authorization servers.',
      );
    }
    const server = await fetchAuthorizationServerMetadata(issuer, signal);
    return Object.freeze({ server, resource });
  }
  const server = await fetchAuthorizationServerMetadata(serverUrl, signal);
  return Object.freeze({ server });
}

/**
 * Fetch authorization-server metadata (RFC 8414). Tries
 * `/.well-known/oauth-authorization-server` first, then
 * `/.well-known/openid-configuration` as the OpenID-Connect fallback.
 *
 * @stable
 */
export async function fetchAuthorizationServerMetadata(
  serverUrl: string,
  signal?: AbortSignal,
): Promise<OAuthServerMetadata> {
  const candidates = wellKnownCandidates(serverUrl);
  const errors: string[] = [];
  for (const url of candidates) {
    const response = await runFetch(url, signal);
    if (!response.ok) {
      errors.push(`${url} -> ${response.status}`);
      continue;
    }
    const raw = (await response.json()) as Record<string, unknown>;
    return parseServerMetadata(raw);
  }
  throw new OAuthDiscoveryError(
    serverUrl,
    `No reachable authorization-server metadata document at ${candidates.join(', ')} (${errors.join('; ')}).`,
  );
}

/**
 * Try to resolve protected-resource metadata (RFC 9728). Returns
 * `undefined` when the resource does not advertise the document.
 *
 * @stable
 */
export async function tryProtectedResourceMetadata(
  resourceUrl: string,
  signal?: AbortSignal,
): Promise<ProtectedResourceMetadata | undefined> {
  const url = wellKnownUrl(resourceUrl, 'oauth-protected-resource');
  const response = await runFetch(url, signal);
  if (!response.ok) return undefined;
  const raw = (await response.json()) as Record<string, unknown>;
  return parseResourceMetadata(raw);
}

function wellKnownCandidates(serverUrl: string): ReadonlyArray<string> {
  return [
    wellKnownUrl(serverUrl, 'oauth-authorization-server'),
    wellKnownUrl(serverUrl, 'openid-configuration'),
  ];
}

function wellKnownUrl(serverUrl: string, suffix: string): string {
  const base = serverUrl.replace(/\/+$/u, '');
  return `${base}/.well-known/${suffix}`;
}

function parseServerMetadata(raw: Record<string, unknown>): OAuthServerMetadata {
  const issuer = requireString(raw, 'issuer');
  const authorizationEndpoint = requireString(raw, 'authorization_endpoint');
  const tokenEndpoint = requireString(raw, 'token_endpoint');
  const out: OAuthServerMetadata = Object.freeze({
    issuer,
    authorizationEndpoint,
    tokenEndpoint,
    ...(typeof raw.registration_endpoint === 'string'
      ? { registrationEndpoint: raw.registration_endpoint }
      : {}),
    ...(typeof raw.revocation_endpoint === 'string'
      ? { revocationEndpoint: raw.revocation_endpoint }
      : {}),
    ...(typeof raw.device_authorization_endpoint === 'string'
      ? { deviceAuthorizationEndpoint: raw.device_authorization_endpoint }
      : {}),
    ...(typeof raw.userinfo_endpoint === 'string'
      ? { userinfoEndpoint: raw.userinfo_endpoint }
      : {}),
    ...(typeof raw.jwks_uri === 'string' ? { jwksUri: raw.jwks_uri } : {}),
    ...(Array.isArray(raw.scopes_supported)
      ? { scopesSupported: Object.freeze([...filterStrings(raw.scopes_supported)]) }
      : {}),
    ...(Array.isArray(raw.response_types_supported)
      ? { responseTypesSupported: Object.freeze([...filterStrings(raw.response_types_supported)]) }
      : {}),
    ...(Array.isArray(raw.grant_types_supported)
      ? { grantTypesSupported: Object.freeze([...filterStrings(raw.grant_types_supported)]) }
      : {}),
    ...(Array.isArray(raw.code_challenge_methods_supported)
      ? {
          codeChallengeMethodsSupported: Object.freeze([
            ...filterStrings(raw.code_challenge_methods_supported),
          ]),
        }
      : {}),
    raw: Object.freeze({ ...raw }),
  });
  return out;
}

function parseResourceMetadata(raw: Record<string, unknown>): ProtectedResourceMetadata {
  const resource = requireString(raw, 'resource');
  const authServers = Array.isArray(raw.authorization_servers)
    ? Object.freeze([...filterStrings(raw.authorization_servers)])
    : Object.freeze<string[]>([]);
  const out: ProtectedResourceMetadata = Object.freeze({
    resource,
    authorizationServers: authServers,
    ...(Array.isArray(raw.bearer_methods_supported)
      ? { bearerMethodsSupported: Object.freeze([...filterStrings(raw.bearer_methods_supported)]) }
      : {}),
    ...(typeof raw.resource_documentation === 'string'
      ? { resourceDocumentation: raw.resource_documentation }
      : {}),
    raw: Object.freeze({ ...raw }),
  });
  return out;
}

function requireString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new OAuthDiscoveryError(
      String(raw.issuer ?? 'unknown'),
      `Discovery payload missing required string field '${key}'.`,
    );
  }
  return value;
}

function* filterStrings(values: ReadonlyArray<unknown>): Iterable<string> {
  for (const value of values) {
    if (typeof value === 'string') yield value;
  }
}
