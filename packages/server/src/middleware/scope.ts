/**
 * Per-route scope enforcement. Reads the verified token populated by
 * the auth middleware and short-circuits with `403` when the granted
 * set does not match the required scope.
 *
 * @packageDocumentation
 */

import { type ParsedScope, parseScope, scopeMatches } from '@graphorin/security/auth';
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

function resolveRequirement(
  requirement: ScopeRequirement,
  path: string,
  params: Record<string, string>,
): ParsedScope {
  if (typeof requirement === 'function') {
    const next = requirement(path, params);
    return typeof next === 'string' ? parseScope(next) : next;
  }
  return typeof requirement === 'string' ? parseScope(requirement) : requirement;
}
