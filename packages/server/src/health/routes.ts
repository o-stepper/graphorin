/**
 * Health-family REST routes.
 *
 *   GET    /health                       (unauthenticated; liveness)
 *   GET    /health/secrets               (admin scope)
 *   GET    /metrics                      (Prometheus exposition)
 *
 * `/health` returns 200 even when the rollup is `'degraded'`; only
 * `'failing'` short-circuits with 503 so liveness probes do not flap
 * on minor degradations (e.g. WAL above the warn threshold).
 *
 * @packageDocumentation
 */

import { getSecretsStoreStatus } from '@graphorin/security/secrets';
import type { Context } from 'hono';
import { Hono } from 'hono';

import type { ServerVariables } from '../internal/context.js';
import type { MetricRegistry } from '../metrics/registry.js';
import { createScopeMiddleware } from '../middleware/scope.js';
import { collectHealth, type HealthCheckOptions } from './checks.js';

/**
 * @stable
 */
export interface HealthRouteOptions {
  readonly version: string;
  readonly startedAt: number;
  readonly now?: () => number;
  readonly probes: () => HealthCheckOptions | Promise<HealthCheckOptions>;
}

/**
 * Public health route (anonymous; mounted before auth middleware).
 * Returns the rollup + per-check breakdown; HTTP 200 even when the
 * rollup is `'degraded'` so liveness probes do not flap on minor
 * degradations. Only `'failing'` short-circuits with 503.
 *
 * @stable
 */
export function createExtendedHealthRoutes(
  options: HealthRouteOptions,
): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const now = options.now ?? Date.now;

  app.get('/', async (c) => {
    const probes = await options.probes();
    const summary = await collectHealth(probes);
    const body = {
      status: summary.status,
      version: options.version,
      uptimeSeconds: Math.max(0, Math.floor((now() - options.startedAt) / 1000)),
      checks: summary.checks,
    };
    if (summary.status === 'failing') {
      return c.json(body, 503);
    }
    return c.json(body, 200);
  });

  return app;
}

/**
 * Authed health route. Mounted at `${base}/health/secrets` AFTER the
 * auth middleware so the scope check has a verified token to inspect.
 * Returns the active secrets store + fallback chain + downgrade
 * reason per the secrets capability matrix.
 *
 * @stable
 */
export function createSecretsHealthRoutes(): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/', createScopeMiddleware('secrets:read'), (c) => {
    const status = getSecretsStoreStatus();
    if (status === undefined) {
      return c.json(
        {
          active: 'unknown',
          fallbackChain: [] as ReadonlyArray<string>,
          strictMode: false,
          headlessReasons: [] as ReadonlyArray<string>,
          message: 'Secrets store has not been activated yet.',
        },
        200,
      );
    }
    return c.json(
      {
        active: status.active,
        fallbackChain: [...status.fallbackChain],
        ...(status.downgradedFrom !== undefined ? { downgradedFrom: status.downgradedFrom } : {}),
        ...(status.downgradeReason !== undefined
          ? { downgradeReason: status.downgradeReason }
          : {}),
        strictMode: status.strictMode,
        headlessReasons: [...status.headlessReasons],
      },
      200,
    );
  });

  return app;
}

/**
 * @stable
 */
export interface MetricsRoutesOptions {
  readonly registry: MetricRegistry;
  readonly requireAuth?: boolean;
  /**
   * Optional refresh callback invoked before every scrape. Use it to
   * sample live signals (WAL size, in-flight runs, daemon status,
   * replay buffer occupancy) into the registry so the scraped output
   * reflects the moment of the request.
   *
   * Refresh failures are swallowed - a broken probe never blocks a
   * Prometheus scrape - and surfaced through the optional `onError`
   * sink.
   */
  readonly refresh?: () => void | Promise<void>;
  readonly onError?: (err: unknown) => void;
}

/**
 * @stable
 */
export function createMetricsRoutes(
  options: MetricsRoutesOptions,
): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const handler = async (c: Context<{ Variables: ServerVariables }>) => {
    if (options.refresh !== undefined) {
      try {
        await options.refresh();
      } catch (err) {
        options.onError?.(err);
      }
    }
    const body = options.registry.render();
    c.header('Content-Type', options.registry.contentType());
    return c.body(body, 200);
  };
  if (options.requireAuth === true) {
    app.get('/', createScopeMiddleware('admin:metrics:read'), handler);
  } else {
    app.get('/', handler);
  }
  return app;
}
