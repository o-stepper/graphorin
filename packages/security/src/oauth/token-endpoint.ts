/**
 * Low-level token-endpoint client. The Authorization Code, Device,
 * and Refresh flows all funnel into a single POST to the token
 * endpoint with `application/x-www-form-urlencoded` body per
 * RFC 6749 § 3.2 + OAuth 2.1.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';

import { OAuthFlowAbortedError } from './errors.js';

/** Strategy hook used by tests to inject synthetic token responses. */
export type TokenEndpointFetcher = (
  url: string,
  init: { body: string; signal?: AbortSignal; basicAuth?: string },
) => Promise<TokenEndpointResponse>;

/** Internal HTTP-style response shape consumed by the higher-level flows. */
export interface TokenEndpointResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText?: string;
  readonly body: TokenEndpointBody;
}

/**
 * Parsed body returned by the token endpoint. Mirrors the shape
 * defined by RFC 6749 § 5.1 + the device-flow extension.
 *
 * @stable
 */
export interface TokenEndpointBody {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly id_token?: string;
  readonly token_type?: string;
  readonly expires_in?: number;
  readonly scope?: string;
  readonly error?: string;
  readonly error_description?: string;
  readonly error_uri?: string;
  readonly interval?: number;
  readonly [extra: string]: unknown;
}

let activeFetcher: TokenEndpointFetcher | null = null;

/**
 * Override the token-endpoint fetcher. Used by the test suite to
 * inject canned responses without hitting the network.
 *
 * @experimental
 */
export function _setTokenEndpointFetcherForTesting(fetcher: TokenEndpointFetcher | null): void {
  activeFetcher = fetcher;
}

/**
 * POST `params` to the token endpoint and return the parsed JSON
 * body. The helper does not throw on non-2xx responses — the caller
 * is responsible for branching on `.ok` so error responses can
 * surface the spec-defined `error` / `error_description` fields.
 *
 * @stable
 */
export async function postToTokenEndpoint(
  endpoint: string,
  params: Readonly<Record<string, string>>,
  options: { signal?: AbortSignal; basicAuth?: string } = {},
): Promise<TokenEndpointResponse> {
  if (options.signal?.aborted === true) throw new OAuthFlowAbortedError('callback');
  const body = encodeForm(params);
  if (activeFetcher !== null) {
    return activeFetcher(endpoint, {
      body,
      ...(options.signal === undefined ? {} : { signal: options.signal }),
      ...(options.basicAuth === undefined ? {} : { basicAuth: options.basicAuth }),
    });
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };
  if (options.basicAuth !== undefined) headers.Authorization = `Basic ${options.basicAuth}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
  let parsed: TokenEndpointBody;
  try {
    parsed = (await response.json()) as TokenEndpointBody;
  } catch {
    parsed = {};
  }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: parsed,
  };
}

function encodeForm(params: Readonly<Record<string, string>>): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    out.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return out.join('&');
}

/**
 * Encode HTTP Basic credentials.
 *
 * @internal
 */
export function encodeBasicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
}
