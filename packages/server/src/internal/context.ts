/**
 * Per-request context shape stored on the Hono `c.var` slot. Consumers
 * (route handlers, audit middleware, idempotency middleware) read these
 * fields through type-safe accessors defined in this module.
 *
 * @packageDocumentation
 */

import type { ParsedScope, VerifiedToken } from '@graphorin/security/auth';

/**
 * Discriminator for the request authentication state.
 *
 * @stable
 */
export type AuthState =
  | { readonly kind: 'unauthenticated' }
  | {
      readonly kind: 'token';
      readonly token: VerifiedToken;
      readonly grantedScopes: ReadonlyArray<ParsedScope>;
    }
  // IP-13: authentication is disabled server-wide (`auth.kind = 'none'`,
  // the documented trusted-loopback / single-operator mode). There is no
  // token, but the request is fully authorized - `grantedScopes` carries
  // `admin:*` so every scope check passes uniformly.
  | {
      readonly kind: 'anonymous';
      readonly grantedScopes: ReadonlyArray<ParsedScope>;
    };

/**
 * Request-scoped variables surfaced through `c.var` in Hono. The
 * server's middleware populates these fields incrementally; route
 * handlers consume them through `getRequestState`.
 *
 * @stable
 */
export interface ServerRequestState {
  readonly requestId: string;
  readonly receivedAt: number;
  readonly clientIp: string | undefined;
  readonly auth: AuthState;
  readonly idempotencyKey?: string;
  readonly idempotencyReplay?: boolean;
}

/**
 * Convenience snapshot of the verified token surfaced on `c.var.token`
 * once the auth middleware has resolved the bearer credential. Mirrors
 * the contract documented in the runtime architecture (Phase 14a §
 * Authentication / authorization middleware: "populates `c.var.token:
 * { id, label, scopes, env }`").
 *
 * Read this through `getRequestToken` so consumers do not have
 * to remember the variable key.
 *
 * @stable
 */
export interface RequestToken {
  readonly id: string;
  readonly label: string | undefined;
  readonly scopes: ReadonlyArray<ParsedScope>;
  readonly env: string;
  readonly expiresAt: number | undefined;
}

/**
 * Hono variable map. Exported so consumers can type their own
 * middleware against the same surface.
 *
 * @stable
 */
export interface ServerVariables extends Record<string, unknown> {
  readonly state: ServerRequestState;
  readonly token?: RequestToken;
}
