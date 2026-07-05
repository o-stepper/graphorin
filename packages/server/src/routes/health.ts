/**
 * `GET /v1/health` - minimal health endpoint kept for backward
 * compatibility with consumers that wired the Phase 14a route
 * factory directly. The active server now mounts the extended
 * Phase 14c routes from `@graphorin/server/health`. New code should
 * use {@link import('../health/routes.js').createExtendedHealthRoutes}.
 *
 * @deprecated Phase 14c. Use `createExtendedHealthRoutes` from
 *             `@graphorin/server/health` instead. This export
 *             stays available so existing consumers do not break.
 *
 * @packageDocumentation
 */

import { Hono } from 'hono';

import type { ServerVariables } from '../internal/context.js';

/**
 * @stable
 */
export interface HealthRoutesDeps {
  readonly version: string;
  readonly startedAt: number;
  readonly now?: () => number;
}

/**
 * @stable
 */
export function createHealthRoutes(deps: HealthRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const now = deps.now ?? Date.now;
  app.get('/', (c) =>
    c.json({
      status: 'ok' as const,
      version: deps.version,
      uptimeSeconds: Math.max(0, Math.floor((now() - deps.startedAt) / 1000)),
    }),
  );
  return app;
}
