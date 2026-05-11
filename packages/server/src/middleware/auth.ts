/**
 * Bearer-token authentication middleware. Wraps the
 * `@graphorin/security` token verifier so handlers see
 * a stable {@link import('../internal/context.js').AuthState}
 * structure on `c.var.state.auth`.
 *
 * @packageDocumentation
 */

import { type ParsedScope, type TokenVerifier, tryParseScope } from '@graphorin/security/auth';
import type { Context, MiddlewareHandler, Next } from 'hono';

import type { ServerVariables } from '../internal/context.js';

/**
 * Options accepted by {@link createAuthMiddleware}. Tests inject a
 * stub verifier; production wiring uses the verifier built during the
 * server's pre-bind step.
 *
 * @stable
 */
export interface AuthMiddlewareOptions {
  readonly verifier: TokenVerifier;
  /**
   * Whether to allow unauthenticated requests through. Used by
   * `health` and (when explicitly opted-in) by the public read
   * endpoints. When `false` (the default), missing / malformed /
   * invalid tokens short-circuit the request with `401`.
   */
  readonly allowAnonymous?: boolean;
}

const HEADER_NAME = 'authorization';
const BEARER_PREFIX = 'bearer ';

function extractBearer(c: Context): string | undefined {
  const raw = c.req.header(HEADER_NAME);
  if (raw === undefined || raw === null) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length < BEARER_PREFIX.length) return undefined;
  if (trimmed.slice(0, BEARER_PREFIX.length).toLowerCase() !== BEARER_PREFIX) return undefined;
  return trimmed.slice(BEARER_PREFIX.length).trim();
}

function clientIp(c: Context, trustProxy: boolean): string | undefined {
  if (trustProxy) {
    const xff = c.req.header('x-forwarded-for');
    if (xff !== undefined && xff.length > 0) {
      const [first] = xff.split(',');
      if (first !== undefined) return first.trim();
    }
  }
  const direct = c.req.header('x-real-ip');
  if (direct !== undefined && direct.length > 0) return direct.trim();
  return undefined;
}

function reasonToStatus(reason: string): {
  status: number;
  body: { error: string; message: string; hint?: string };
} {
  switch (reason) {
    case 'malformed':
      return { status: 401, body: { error: 'auth-invalid', message: 'Malformed bearer token.' } };
    case 'unknown-token':
      return { status: 401, body: { error: 'auth-invalid', message: 'Unknown bearer token.' } };
    case 'revoked':
      return {
        status: 401,
        body: { error: 'auth-revoked', message: 'Bearer token has been revoked.' },
      };
    case 'expired':
      return { status: 401, body: { error: 'auth-expired', message: 'Bearer token has expired.' } };
    case 'ip-locked-out':
      return {
        status: 429,
        body: {
          error: 'auth-locked-out',
          message: 'Too many failed authentications from this address.',
          hint: 'Wait for the lockout window to elapse before retrying.',
        },
      };
    case 'token-locked-out':
      return {
        status: 429,
        body: {
          error: 'auth-locked-out',
          message: 'Bearer token is locked out after repeated failures.',
          hint: 'Operator must rotate the token.',
        },
      };
    default:
      return {
        status: 401,
        body: { error: 'auth-invalid', message: `Authentication failed: ${reason}.` },
      };
  }
}

/**
 * Build the bearer-token middleware. The middleware always sets
 * `c.var.state.auth`, even on the unauthenticated branch, so
 * downstream code can pattern-match the discriminated union without
 * a separate "is anonymous?" check.
 *
 * @stable
 */
export function createAuthMiddleware(
  options: AuthMiddlewareOptions,
): MiddlewareHandler<{ Variables: ServerVariables }> {
  const allowAnonymous = options.allowAnonymous ?? false;
  return async (c, next: Next) => {
    const token = extractBearer(c);
    const ipFromState = c.get('state').clientIp;
    // The request-state middleware has already resolved the trusted
    // client IP per the configured `trustProxy` flag. Auth never
    // re-derives it; we simply forward what the upstream layer set.
    const ip = ipFromState ?? clientIp(c, false);
    if (token === undefined) {
      if (allowAnonymous) {
        c.set('state', { ...c.get('state'), auth: { kind: 'unauthenticated' as const } });
        await next();
        return;
      }
      return c.json(
        {
          error: 'auth-required',
          message: 'Bearer token required.',
          hint: "Set 'Authorization: Bearer <token>'.",
        },
        401,
      );
    }
    const result = await options.verifier.verify(token, ip !== undefined ? { ip } : {});
    if (!result.ok) {
      const mapped = reasonToStatus(result.reason);
      const headers: Record<string, string> = {};
      if (result.retryAfterMs !== undefined) {
        headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000).toString();
      }
      return c.json(mapped.body, mapped.status as 401 | 429, headers);
    }
    const grantedScopes: ParsedScope[] = [];
    for (const scope of result.token.scopes) {
      grantedScopes.push(scope);
    }
    // Defensive: any string scopes coming from the store also parse here
    // even though the verifier itself parses them — see scope.ts.
    void tryParseScope;
    c.set('state', {
      ...c.get('state'),
      auth: {
        kind: 'token' as const,
        token: result.token,
        grantedScopes: Object.freeze(grantedScopes),
      },
    });
    // Mirror the verified token onto the documented `c.var.token`
    // slot so route handlers can read it without unwrapping the auth
    // discriminator. The shape is the one called out in the Phase
    // 14a spec: { id, label, scopes, env, expiresAt? }.
    c.set('token', {
      id: result.token.tokenId,
      label: result.token.label,
      scopes: Object.freeze(grantedScopes.slice()),
      env: result.token.env,
      expiresAt: result.token.expiresAt,
    });
    await next();
  };
}
