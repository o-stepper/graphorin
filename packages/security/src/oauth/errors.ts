/**
 * Typed error classes for the outbound OAuth subsystem. Each error
 * carries a stable `kind` discriminator so callers can branch on
 * structured causes instead of message-string sniffing.
 *
 * @packageDocumentation
 */

/**
 * Base class for every OAuth subsystem error. The framework follows
 * the project-wide convention of typed `kind` discriminators.
 *
 * @stable
 */
export class GraphorinOAuthError extends Error {
  readonly kind: string;
  readonly hint?: string;

  constructor(kind: string, message: string, options: { cause?: unknown; hint?: string } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'GraphorinOAuthError';
    this.kind = kind;
    if (options.hint !== undefined) this.hint = options.hint;
  }
}

/**
 * Thrown when the discovery pipeline cannot resolve a usable
 * authorization-server metadata document for the configured server URL.
 *
 * @stable
 */
export class OAuthDiscoveryError extends GraphorinOAuthError {
  readonly serverUrl: string;
  constructor(serverUrl: string, message: string, options: { cause?: unknown } = {}) {
    super('discovery-failed', message, {
      hint: 'Confirm the server publishes /.well-known/oauth-authorization-server (RFC 8414) or /.well-known/oauth-protected-resource (RFC 9728).',
      ...(options.cause === undefined ? {} : { cause: options.cause }),
    });
    this.name = 'OAuthDiscoveryError';
    this.serverUrl = serverUrl;
  }
}

/**
 * Thrown when Dynamic Client Registration is requested against an
 * authorization server that does not advertise a registration
 * endpoint.
 *
 * @stable
 */
export class OAuthRegistrationUnsupportedError extends GraphorinOAuthError {
  constructor(serverUrl: string) {
    super(
      'registration-unsupported',
      `Authorization server '${serverUrl}' does not advertise a registration_endpoint (RFC 7591). Pass a pre-registered clientId via createOAuthClient({ registration }).`,
      { hint: 'Pass `registration: { clientId, ... }` to createOAuthClient(...).' },
    );
    this.name = 'OAuthRegistrationUnsupportedError';
  }
}

/**
 * Thrown by `OAuthClient.refresh(...)` when the refresh attempt is
 * rejected by the authorization server.
 *
 * @stable
 */
export class OAuthRefreshError extends GraphorinOAuthError {
  readonly serverId: string;
  readonly providerError?: string;
  constructor(
    serverId: string,
    providerError: string | undefined,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super('refresh-failed', message, {
      hint: 'Re-authenticate with `loginInteractive(...)` or the equivalent CLI command.',
      ...(options.cause === undefined ? {} : { cause: options.cause }),
    });
    this.name = 'OAuthRefreshError';
    this.serverId = serverId;
    if (providerError !== undefined) this.providerError = providerError;
  }
}

/**
 * Thrown when the authorization server reports the token is no longer
 * valid (`invalid_grant` family).
 *
 * @stable
 */
export class OAuthRevokedError extends GraphorinOAuthError {
  readonly serverId: string;
  constructor(serverId: string, reason: string) {
    super('revoked', `OAuth session for '${serverId}' is revoked: ${reason}`, {
      hint: 'Re-authenticate via `loginInteractive(...)`.',
    });
    this.name = 'OAuthRevokedError';
    this.serverId = serverId;
  }
}

/**
 * Thrown when the localhost callback handler receives a request that
 * does not match the original PKCE verifier / state parameter.
 *
 * @stable
 */
export class OAuthCallbackError extends GraphorinOAuthError {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super('callback-failed', message, options);
    this.name = 'OAuthCallbackError';
  }
}

/**
 * Thrown when the authorization request itself returns an error
 * response (the `error=` query parameter is set on the callback).
 *
 * @stable
 */
export class OAuthAuthorizationError extends GraphorinOAuthError {
  readonly oauthError: string;
  readonly oauthErrorDescription?: string;
  constructor(oauthError: string, oauthErrorDescription: string | undefined) {
    super(
      'authorization-error',
      `Authorization server returned error='${oauthError}'${
        oauthErrorDescription === undefined ? '' : ` (${oauthErrorDescription})`
      }`,
    );
    this.name = 'OAuthAuthorizationError';
    this.oauthError = oauthError;
    if (oauthErrorDescription !== undefined) this.oauthErrorDescription = oauthErrorDescription;
  }
}

/**
 * Thrown when the OAuth flow is aborted via an `AbortSignal`.
 *
 * @stable
 */
export class OAuthFlowAbortedError extends GraphorinOAuthError {
  constructor(stage: 'browser' | 'callback' | 'device-poll' | 'discovery' | 'registration') {
    super('aborted', `OAuth flow aborted at stage '${stage}'.`);
    this.name = 'OAuthFlowAbortedError';
  }
}

/**
 * Thrown when no localhost port in the configured range can accept a
 * binding (e.g. another process has every port in the range open).
 *
 * @stable
 */
export class OAuthCallbackPortError extends GraphorinOAuthError {
  constructor(low: number, high: number, attempts: number) {
    super(
      'callback-port-unavailable',
      `Could not bind any localhost port in [${low}, ${high}] after ${attempts} attempts.`,
    );
    this.name = 'OAuthCallbackPortError';
  }
}

/**
 * Thrown when the optional `openid-client` peer is not installed.
 *
 * @stable
 */
export class OAuthPeerDependencyMissingError extends GraphorinOAuthError {
  readonly packageName: string;
  constructor(packageName = 'openid-client') {
    super(
      'peer-missing',
      `OAuth subsystem requires optional peer dependency '${packageName}'. Install it with 'pnpm add ${packageName}'.`,
      { hint: `pnpm add ${packageName}` },
    );
    this.name = 'OAuthPeerDependencyMissingError';
    this.packageName = packageName;
  }
}
