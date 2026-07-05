/**
 * Middleware wiring for `createServer({...})`.
 *
 * Two attachment points, called in this order by the composition:
 *
 * 1. {@link attachGlobalMiddleware} - request-state / CORS / CSRF /
 *    rate-limit, mounted on `*` at app construction time.
 * 2. {@link attachProtectedMiddleware} - auth + audit + idempotency
 *    for the authenticated subtree, mounted by `mountRoutes` after
 *    the unauthenticated health / metrics endpoints.
 *
 * The relative order of these layers is part of the documented
 * contract - do not reorder.
 *
 * @packageDocumentation
 */

import type { TokenVerifier } from '@graphorin/security';
import type { AuditDb } from '@graphorin/security/audit';
import type { GraphorinSqliteStore } from '@graphorin/store-sqlite';
import type { Hono } from 'hono';
import type { ServerConfigSpec } from './config.js';
import type { ServerVariables } from './internal/context.js';
import type { MetricRegistry } from './metrics/registry.js';
import {
  createAnonymousAuthMiddleware,
  createAuditMiddleware,
  createAuthMiddleware,
  createCorsMiddleware,
  createCsrfMiddleware,
  createIdempotencyMiddleware,
  createRateLimitMiddleware,
  createRequestStateMiddleware,
} from './middleware/index.js';

/**
 * Global middleware in the documented order. Per-route scope +
 * idempotency layers are mounted by the route factories so the
 * composition stays declarative + auditable.
 */
export function attachGlobalMiddleware(
  app: Hono<{ Variables: ServerVariables }>,
  config: ServerConfigSpec,
  now: () => number,
): void {
  app.use(
    '*',
    createRequestStateMiddleware({
      now,
      ...(config.server.trustProxy ? { trustProxy: true } : {}),
    }),
  );
  app.use('*', createCorsMiddleware(config.server.cors));
  app.use('*', createCsrfMiddleware(config.server.csrf));
  app.use('*', createRateLimitMiddleware(config.server.rateLimit, { now }));
}

/** Dependencies consumed by {@link attachProtectedMiddleware}. */
export interface ProtectedMiddlewareContext {
  readonly now: () => number;
  readonly store: GraphorinSqliteStore;
  readonly metricRegistry: MetricRegistry;
  readonly verifier?: TokenVerifier | undefined;
  readonly auditDb?: AuditDb | undefined;
}

/**
 * Authenticated subtree begins here. The health endpoint above is
 * intentionally outside the auth boundary so liveness probes work
 * before the token verifier is wired. The WebSocket upgrade path is
 * also exempt: the upgrade handler in `ws/upgrade.ts` performs its
 * own bearer + ticket validation inline (the HTTP auth middleware
 * would otherwise short-circuit the upgrade with a 401 response
 * before the handler can negotiate the subprotocol).
 */
export function attachProtectedMiddleware(
  app: Hono<{ Variables: ServerVariables }>,
  config: ServerConfigSpec,
  ctx: ProtectedMiddlewareContext,
): { readonly anonymousAuth: boolean } {
  const base = config.server.basePath;
  const wsUpgradePath = config.server.ws.enabled ? `${base}${config.server.ws.path}` : undefined;
  const metricsPath =
    config.metrics.enabled && !config.metrics.requireAuth
      ? `${base}${config.metrics.path}`
      : undefined;
  function shouldSkipAuth(path: string): boolean {
    if (path === `${base}/health` || path === `${base}/health/`) return true;
    if (wsUpgradePath !== undefined) {
      if (path === wsUpgradePath || path === `${wsUpgradePath}/`) return true;
    }
    if (metricsPath !== undefined) {
      if (path === metricsPath || path === `${metricsPath}/`) return true;
    }
    return false;
  }
  // IP-13: in the no-auth loopback mode (`auth.kind='none'`) there is no
  // verifier, but the authenticated subtree must still be reachable - install
  // an anonymous middleware that stamps a fully-authorized principal so the
  // domain routes serve instead of every one of them returning 401.
  const anonymousAuth = ctx.verifier === undefined && config.auth.kind === 'none';
  if (ctx.verifier !== undefined || anonymousAuth) {
    const authMw =
      ctx.verifier !== undefined
        ? createAuthMiddleware({ verifier: ctx.verifier })
        : createAnonymousAuthMiddleware();
    app.use(`${base}/*`, async (c, next) => {
      if (shouldSkipAuth(c.req.path)) {
        await next();
        return;
      }
      return authMw(c, next);
    });
    if (ctx.auditDb !== undefined) {
      const auditMw = createAuditMiddleware({ auditDb: ctx.auditDb, now: ctx.now });
      app.use(`${base}/*`, async (c, next) => {
        if (shouldSkipAuth(c.req.path)) {
          await next();
          return;
        }
        return auditMw(c, next);
      });
    }
  }

  // Idempotency middleware - applied to side-effecting endpoints. We
  // mount it once on the authenticated subtree so handlers don't have
  // to duplicate the configuration per-route.
  if (config.server.idempotency.enabled) {
    const idempotencyMw = createIdempotencyMiddleware({
      store: ctx.store.idempotency,
      config: config.server.idempotency,
      now: ctx.now,
      // IP-6: token minting returns a raw secret - never cache it.
      excludeResponseCachePaths: [`${base}/tokens`],
      // IP-15: publish the live cache hit ratio gauge.
      metricRegistry: ctx.metricRegistry,
    });
    app.use(`${base}/*`, async (c, next) => {
      if (shouldSkipAuth(c.req.path)) {
        await next();
        return;
      }
      return idempotencyMw(c, next);
    });
  }

  return { anonymousAuth };
}
