/**
 * Authorization Code + PKCE flow (RFC 6749 + RFC 7636 + OAuth 2.1).
 *
 * The flow is broken into three phases:
 *
 * 1. **Local server bind** — start the localhost callback server
 *    (random port in the operator-supplied range).
 * 2. **Browser open** — render the authorization URL via the
 *    operator-supplied `openAuthorizationUrl` callback (defaults to
 *    `openInBrowser(...)`).
 * 3. **Token exchange** — once the callback fires, POST the code +
 *    PKCE verifier to the token endpoint.
 *
 * Cancellation via `AbortSignal` aborts every phase.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { SecretValue } from '../secrets/secret-value.js';
import { openInBrowser } from './browser.js';
import {
  type LocalCallbackServer,
  type LocalCallbackServerOptions,
  startLocalCallbackServer,
} from './callback-server.js';
import { OAuthAuthorizationError, OAuthCallbackError, OAuthFlowAbortedError } from './errors.js';
import { computePkceChallenge, generatePkceVerifier, generateState } from './pkce.js';
import { encodeBasicAuth, postToTokenEndpoint } from './token-endpoint.js';
import type {
  AuthorizeCodeOptions,
  DiscoveredMetadata,
  OAuthRegistration,
  OAuthSession,
} from './types.js';

/** Internal arguments fed into {@link runAuthorizationCodeFlow}. */
export interface AuthorizationCodeFlowArgs {
  readonly serverId: string;
  readonly metadata: DiscoveredMetadata;
  readonly registration: OAuthRegistration;
  readonly options: AuthorizeCodeOptions;
}

/**
 * Drive the Authorization Code + PKCE flow. The function is exposed
 * for tests and for higher-level orchestration in `client.ts`.
 *
 * @stable
 */
export async function runAuthorizationCodeFlow(
  args: AuthorizationCodeFlowArgs,
): Promise<OAuthSession> {
  const { serverId, metadata, registration, options } = args;
  const { server } = metadata;
  const signal = options.signal;
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('callback');

  let callback: LocalCallbackServer | undefined;
  let redirectUri = options.redirectUri;
  if (redirectUri === undefined) {
    const serverOpts: LocalCallbackServerOptions = {
      ...(options.portRange === undefined ? {} : { portRange: options.portRange }),
    };
    callback = await startLocalCallbackServer(serverOpts);
    redirectUri = callback.redirectUri;
  }

  const verifier = generatePkceVerifier();
  const challenge = computePkceChallenge(verifier);
  const state = generateState();

  const authorizationUrl = buildAuthorizationUrl({
    endpoint: server.authorizationEndpoint,
    clientId: registration.clientId,
    redirectUri,
    ...(options.scope === undefined ? {} : { scope: options.scope }),
    challenge,
    state,
  });

  const browserOpener = options.openAuthorizationUrl ?? openInBrowser;
  const opening = Promise.resolve()
    .then(() => browserOpener(authorizationUrl, signal))
    .catch((err) => {
      if (callback === undefined) throw err;
    });

  let code: string;
  let returnedState: string | undefined;
  if (callback !== undefined) {
    try {
      const params = await waitWithTimeout(
        callback.waitForCallback(signal),
        options.callbackTimeoutMs,
      );
      if (params.state !== undefined) returnedState = params.state;
      code = params.code;
      if (returnedState !== undefined && returnedState !== state) {
        throw new OAuthCallbackError(
          'Authorization callback returned a `state` value that does not match the expected one.',
        );
      }
    } finally {
      await callback.close();
    }
  } else {
    // Caller managed redirect; no built-in callback wait.
    throw new OAuthCallbackError(
      'A redirectUri was supplied without a callback handler. Either omit redirectUri to use the built-in localhost callback or supply your own waiter.',
    );
  }

  await opening;

  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: registration.clientId,
    code_verifier: verifier,
  };
  if (registration.clientSecret !== undefined) {
    // Confidential client — Basic auth header is preferred per
    // RFC 6749 § 2.3.1.
    const basic = encodeBasicAuth(registration.clientId, registration.clientSecret.reveal());
    return await exchangeForTokens(server.tokenEndpoint, params, signal, basic, serverId);
  }
  return await exchangeForTokens(server.tokenEndpoint, params, signal, undefined, serverId);
}

interface BuildAuthorizationUrlArgs {
  readonly endpoint: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope?: string;
  readonly challenge: string;
  readonly state: string;
}

function buildAuthorizationUrl(args: BuildAuthorizationUrlArgs): string {
  const url = new URL(args.endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('code_challenge', args.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', args.state);
  if (args.scope !== undefined) url.searchParams.set('scope', args.scope);
  return url.toString();
}

async function exchangeForTokens(
  tokenEndpoint: string,
  params: Readonly<Record<string, string>>,
  signal: AbortSignal | undefined,
  basicAuth: string | undefined,
  serverId: string,
): Promise<OAuthSession> {
  const response = await postToTokenEndpoint(tokenEndpoint, params, {
    ...(signal === undefined ? {} : { signal }),
    ...(basicAuth === undefined ? {} : { basicAuth }),
  });
  if (!response.ok || response.body.error !== undefined) {
    throw new OAuthAuthorizationError(
      response.body.error ?? `http_${response.status}`,
      response.body.error_description ?? response.statusText,
    );
  }
  return buildOAuthSession(serverId, response.body);
}

/**
 * Construct an {@link OAuthSession} from a successful token-endpoint
 * payload. Exported for the device + refresh flows so they share a
 * single mapping path.
 *
 * @stable
 */
export function buildOAuthSession(
  serverId: string,
  body: import('./token-endpoint.js').TokenEndpointBody,
  override?: { readonly issuedAt?: number },
): OAuthSession {
  if (typeof body.access_token !== 'string' || body.access_token.length === 0) {
    throw new OAuthAuthorizationError(
      'invalid_token_response',
      'Token endpoint did not return an access_token.',
    );
  }
  const issuedAt = override?.issuedAt ?? Date.now();
  const expiresAt =
    typeof body.expires_in === 'number' && body.expires_in > 0
      ? issuedAt + body.expires_in * 1000
      : undefined;
  return Object.freeze({
    serverId,
    accessToken: SecretValue.fromString(body.access_token, {
      source: { resolver: 'oauth', ref: `oauth:${serverId}:access` },
    }),
    ...(typeof body.refresh_token === 'string' && body.refresh_token.length > 0
      ? {
          refreshToken: SecretValue.fromString(body.refresh_token, {
            source: { resolver: 'oauth', ref: `oauth:${serverId}:refresh` },
          }),
        }
      : {}),
    ...(typeof body.id_token === 'string' && body.id_token.length > 0
      ? {
          idToken: SecretValue.fromString(body.id_token, {
            source: { resolver: 'oauth', ref: `oauth:${serverId}:id` },
          }),
        }
      : {}),
    tokenType:
      typeof body.token_type === 'string' && body.token_type.length > 0
        ? body.token_type
        : 'Bearer',
    ...(typeof body.scope === 'string' && body.scope.length > 0 ? { scope: body.scope } : {}),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    issuedAt,
  });
}

async function waitWithTimeout<T>(promise: Promise<T>, timeoutMs: number | undefined): Promise<T> {
  if (timeoutMs === undefined) return promise;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new OAuthCallbackError(`Authorization callback timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

void Buffer; // Imported for parity with the other modules; not used directly.
