/**
 * Deterministic identity router: maps a {@link ChannelIdentity}
 * triple onto `{ sessionKey, agentId }`.
 *
 * The mapping is DATA, not code: the application supplies an ordered
 * route table; the first matching row wins and a catch-all default
 * route (a row with no identity constraints) is mandatory so routing
 * is total. Access control happens BEFORE routing (see the access
 * policy in `./access.js`) - by the time an inbound message reaches
 * the router it is already authorized, so the router never makes an
 * allow/deny decision.
 *
 * `sessionKey` is a routing selector, never an authorization token:
 * it decides WHERE a conversation lands, not WHO may speak.
 *
 * @packageDocumentation
 */

import type { ChannelIdentity } from './spi.js';

/**
 * One row of the route table. Omitted identity fields match any
 * value; `agentId` is mandatory. When `sessionKey` is omitted the
 * router derives a stable per-peer key
 * `<channelId>:<accountId>:<peerId>` so distinct peers never share a
 * session by accident; set it explicitly to pool conversations into
 * one session on purpose.
 *
 * @stable
 */
export interface ChannelRoute {
  readonly channelId?: string;
  readonly accountId?: string;
  readonly peerId?: string;
  readonly agentId: string;
  readonly sessionKey?: string;
}

/**
 * The routing outcome: which agent handles the conversation and
 * under which session key.
 *
 * @stable
 */
export interface ResolvedChannelRoute {
  readonly agentId: string;
  readonly sessionKey: string;
  /** Index of the matched row in the supplied route table (audit). */
  readonly routeIndex: number;
}

/** Options for {@link createIdentityRouter}. @stable */
export interface IdentityRouterOptions {
  /** Ordered route table; first match wins. Must contain a catch-all default route. */
  readonly routes: ReadonlyArray<ChannelRoute>;
}

/**
 * Deterministic router over the route table.
 *
 * @stable
 */
export interface IdentityRouter {
  /** Total function: always resolves (the default route guarantees a match). */
  resolve(identity: ChannelIdentity): ResolvedChannelRoute;
  readonly routes: ReadonlyArray<ChannelRoute>;
}

/**
 * Configuration error thrown eagerly by {@link createIdentityRouter}
 * so a misconfigured gateway fails at construction, not on the first
 * message.
 *
 * @stable
 */
export class ChannelRouteConfigError extends Error {
  override readonly name = 'ChannelRouteConfigError';
  constructor(message: string) {
    super(`[graphorin/channels] invalid route table: ${message}`);
  }
}

/**
 * Derive the default per-peer session key. Exposed so applications
 * and the docs agree on the exact shape.
 *
 * @stable
 */
export function defaultSessionKey(identity: ChannelIdentity): string {
  return `${identity.channelId}:${identity.accountId}:${identity.peerId}`;
}

function matches(route: ChannelRoute, identity: ChannelIdentity): boolean {
  if (route.channelId !== undefined && route.channelId !== identity.channelId) return false;
  if (route.accountId !== undefined && route.accountId !== identity.accountId) return false;
  if (route.peerId !== undefined && route.peerId !== identity.peerId) return false;
  return true;
}

function isCatchAll(route: ChannelRoute): boolean {
  return (
    route.channelId === undefined && route.accountId === undefined && route.peerId === undefined
  );
}

/**
 * Build a deterministic identity router. Throws
 * {@link ChannelRouteConfigError} when the table is empty, contains a
 * row with an empty `agentId`, or lacks a catch-all default route.
 *
 * @stable
 */
export function createIdentityRouter(options: IdentityRouterOptions): IdentityRouter {
  const routes = [...options.routes];
  if (routes.length === 0) {
    throw new ChannelRouteConfigError('the route table is empty');
  }
  for (const [index, route] of routes.entries()) {
    if (route.agentId.length === 0) {
      throw new ChannelRouteConfigError(`route #${index} has an empty agentId`);
    }
  }
  if (!routes.some(isCatchAll)) {
    throw new ChannelRouteConfigError(
      'no catch-all default route - append a row without channelId/accountId/peerId ' +
        'constraints so routing stays total',
    );
  }

  function resolve(identity: ChannelIdentity): ResolvedChannelRoute {
    for (const [index, route] of routes.entries()) {
      if (!matches(route, identity)) continue;
      return {
        agentId: route.agentId,
        sessionKey: route.sessionKey ?? defaultSessionKey(identity),
        routeIndex: index,
      };
    }
    // Unreachable: the catch-all is validated at construction.
    throw new ChannelRouteConfigError('no route matched (catch-all missing at runtime)');
  }

  return Object.freeze({ resolve, routes: Object.freeze(routes) });
}
