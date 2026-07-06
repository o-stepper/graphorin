/**
 * Auth-related REST routes that exist purely to support the WebSocket
 * surface in `@graphorin/server/ws`.
 *
 *   POST /session/ws-ticket    (scope `agents:invoke`)
 *
 * Browser clients call the endpoint with a regular HTTP `Authorization:
 * Bearer <token>` header to mint a single-use, short-lived ticket; the
 * ticket value is then attached to the WebSocket upgrade request as a
 * second `Sec-WebSocket-Protocol` token (`ticket.<value>`). The
 * server-side WS upgrade handler (see `../ws/upgrade.ts`) consumes the
 * ticket against the same in-memory store so the round-trip is
 * race-free.
 *
 * @packageDocumentation
 */

import { Hono } from 'hono';

import type { ServerVariables } from '../internal/context.js';
import { createAuthenticatedMiddleware } from '../middleware/scope.js';
import type { WsTicketStore } from '../ws/ticket.js';

/**
 * Stable shape consumed by {@link createAuthRoutes}.
 *
 * @stable
 */
export interface AuthRoutesDeps {
  readonly tickets: WsTicketStore;
}

/**
 * Build the auth router. The router is mounted at the same base path
 * as the rest of the REST surface (defaults to `/v1`).
 *
 * @stable
 */
export function createAuthRoutes(deps: AuthRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  // W-107: the ticket ADDS no rights - it carries the principal's own
  // scopes and every subscribe is per-subject gated on the dispatcher -
  // so possession of a valid principal is the whole requirement. The
  // old `agents:invoke` gate locked read-only tokens out of the
  // browser WS path entirely.
  app.post('/session/ws-ticket', createAuthenticatedMiddleware(), (c) => {
    const auth = c.get('state').auth;
    // IP-13: in the no-auth loopback mode (`auth.kind='none'`) there is no
    // bearer token, but the anonymous principal is fully authorized - mint a
    // ticket bound to a synthetic `anonymous` id so a browser client written
    // for token mode still completes the round-trip.
    const principal =
      auth.kind === 'token'
        ? { tokenId: auth.token.tokenId, scopes: auth.grantedScopes }
        : auth.kind === 'anonymous'
          ? { tokenId: 'anonymous', scopes: auth.grantedScopes }
          : undefined;
    if (principal === undefined) {
      return c.json(
        {
          error: 'auth-required',
          message: 'Bearer token required to mint a WS ticket.',
        },
        401,
      );
    }
    const ticket = deps.tickets.issue(principal);
    return c.json(
      {
        ticket: ticket.value,
        expiresAt: ticket.expiresAt,
        ttlMs: deps.tickets.ttlMs,
      },
      201,
    );
  });

  return app;
}
