/**
 * Per-route scope enforcement. Reads the verified token populated by
 * the auth middleware and short-circuits with `403` when the granted
 * set does not match the required scope.
 *
 * @packageDocumentation
 */

import {
  type ParsedScope,
  parseScope,
  scopeMatches,
  tryParseScope,
} from '@graphorin/security/auth';
import type { MiddlewareHandler } from 'hono';

import type { ServerVariables } from '../internal/context.js';

/**
 * Required-scope spec accepted by {@link createScopeMiddleware}. Either
 * a single string (`'agents:invoke'`), a parsed scope, or a function
 * that derives the required scope from the request (e.g. to insert the
 * `:id` segment lazily).
 *
 * @stable
 */
export type ScopeRequirement =
  | string
  | ParsedScope
  | ((path: string, params: Record<string, string>) => string | ParsedScope);

/**
 * @stable
 */
export function createScopeMiddleware(
  requirement: ScopeRequirement,
): MiddlewareHandler<{ Variables: ServerVariables }> {
  return async (c, next) => {
    const auth = c.get('state').auth;
    if (auth.kind === 'anonymous') {
      // IP-13: auth is disabled server-wide (auth.kind='none'). There is no
      // token to scope-check - the trusted-loopback operator is allowed
      // through every gate.
      await next();
      return;
    }
    if (auth.kind === 'unauthenticated') {
      return c.json(
        {
          error: 'auth-required',
          message: 'Authentication required for this endpoint.',
        },
        401,
      );
    }
    const required = resolveRequirement(
      requirement,
      c.req.path,
      c.req.param() as Record<string, string>,
    );
    // W-107: a dynamic requirement built from an arbitrary URL segment
    // may not parse (target charset/length limits). An unparseable
    // requirement can never be granted - answer 403, never throw a 500.
    if (required === undefined) {
      return c.json(
        {
          error: 'scope-denied',
          message: 'Token lacks the required scope (unparseable resource id).',
        },
        403,
      );
    }
    const granted = auth.grantedScopes;
    let allowed = false;
    for (const scope of granted) {
      if (scopeMatches(scope, required)) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      return c.json(
        {
          error: 'scope-denied',
          message: `Token lacks required scope '${required.raw}'.`,
          hint: `Mint a token with the '${required.raw}' (or admin:*) scope.`,
        },
        403,
      );
    }
    await next();
  };
}

/**
 * W-107: authentication-only gate. Lets any authenticated principal
 * (token or the anonymous trusted-loopback operator) through and
 * rejects only `unauthenticated` with 401. Used where possession of a
 * valid principal is the whole requirement - e.g. the ws-ticket mint,
 * which adds no rights of its own (the ticket carries the principal's
 * scopes and every subscribe is per-subject gated).
 *
 * @stable
 */
export function createAuthenticatedMiddleware(): MiddlewareHandler<{
  Variables: ServerVariables;
}> {
  return async (c, next) => {
    const auth = c.get('state').auth;
    if (auth.kind === 'unauthenticated') {
      return c.json(
        {
          error: 'auth-required',
          message: 'Authentication required for this endpoint.',
        },
        401,
      );
    }
    await next();
  };
}

/**
 * W-107: imperative scope check for handlers that must resolve the
 * resource BEFORE the requirement is known (per-resource run control:
 * snapshot first, then require the owning agent's/workflow's scope).
 * Mirrors the middleware exactly: anonymous allows, unauthenticated
 * denies, an unparseable requirement denies.
 *
 * @stable
 */
export function checkScope(
  auth: import('../internal/context.js').AuthState,
  required: string | ParsedScope,
): boolean {
  if (auth.kind === 'anonymous') return true;
  if (auth.kind === 'unauthenticated') return false;
  const parsed = typeof required === 'string' ? tryParseScope(required) : required;
  if (parsed === undefined) return false;
  for (const scope of auth.grantedScopes) {
    if (scopeMatches(scope, parsed)) return true;
  }
  return false;
}

function resolveRequirement(
  requirement: ScopeRequirement,
  path: string,
  params: Record<string, string>,
): ParsedScope | undefined {
  // W-107: dynamic requirements interpolate raw URL segments - use the
  // non-throwing parser so `GET /sessions/<junk>` yields 403, not 500.
  if (typeof requirement === 'function') {
    const next = requirement(path, params);
    return typeof next === 'string' ? tryParseScope(next) : next;
  }
  return typeof requirement === 'string' ? tryParseScope(requirement) : requirement;
}

// `parseScope` stays imported for API parity with older call sites.
void parseScope;
