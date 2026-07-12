/**
 * HTTP route mounting for `createServer({...})` - health, metrics,
 * the authenticated middleware boundary, every REST domain surface,
 * the WebSocket upgrade, and SSE. Mount order is part of the
 * documented contract (unauthenticated health first, then the auth
 * boundary, then metrics + the domain routes; metrics sits behind the
 * boundary so `metrics.requireAuth=true` sees a verified token, while
 * the requireAuth=false path is exempted via the middleware skip
 * list) - do not reorder.
 *
 * @packageDocumentation
 */

import type { TokenVerifier } from '@graphorin/security';
import type { AuditDb } from '@graphorin/security/audit';
import type { GraphorinSqliteStore } from '@graphorin/store-sqlite';
import type { createNodeWebSocket } from '@hono/node-ws';
import type { Hono } from 'hono';
import { refreshLiveMetrics } from './app-metrics.js';
import { attachProtectedMiddleware } from './app-middleware.js';
import type { ChannelsDaemon } from './channels/daemon.js';
import type { ServerConfigSpec } from './config.js';
import type { ConsolidatorDaemon } from './consolidator/daemon.js';
import {
  createExtendedHealthRoutes,
  createMetricsRoutes,
  createSecretsHealthRoutes,
  type HealthCheckOptions,
} from './health/index.js';
import type { ServerVariables } from './internal/context.js';
import type { MetricRegistry } from './metrics/registry.js';
import type { AgentRegistry, WorkflowRegistry } from './registry/index.js';
import { createReplayRoutes, type ReplayApi } from './replay/index.js';
import {
  type AuditApi,
  createAgentRoutes,
  createAuditRoutes,
  createAuthRoutes,
  createMcpRoutes,
  createMemoryRoutes,
  createRunRoutes,
  createSessionRoutes,
  createSkillsRoutes,
  createTokensRoutes,
  createWorkflowRoutes,
  type McpApi,
  type MemoryApi,
  type SessionApi,
  type SkillsApi,
} from './routes/index.js';
import type { RunStateTracker } from './runtime/run-state.js';
import { createSseRoutes } from './sse/index.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import { createTriggersRoutes } from './triggers/routes.js';
import type { WorkflowTimerDaemon } from './workflows/timer-daemon.js';
import type { WsDispatcher, WsTicketStore } from './ws/index.js';
import { createWsUpgradeEvents } from './ws/upgrade.js';

export interface MountRoutesContext {
  readonly version: string;
  readonly startedAt: number;
  readonly now: () => number;
  readonly agents: AgentRegistry;
  readonly workflows: WorkflowRegistry;
  readonly runs: RunStateTracker;
  readonly store: GraphorinSqliteStore;
  readonly metricRegistry: MetricRegistry;
  readonly sessions?: SessionApi;
  readonly memory?: MemoryApi;
  readonly skills?: SkillsApi;
  readonly mcp?: McpApi;
  readonly audit?: AuditApi;
  readonly replay?: ReplayApi;
  readonly healthProbes?: () => HealthCheckOptions | Promise<HealthCheckOptions>;
  readonly verifier?: TokenVerifier;
  readonly auditDb?: AuditDb;
  readonly pepper?: import('@graphorin/security').SecretValue;
  readonly wsDispatcher?: WsDispatcher;
  readonly wsTickets?: WsTicketStore;
  readonly wsAdapter?: ReturnType<typeof createNodeWebSocket>;
  readonly triggersDaemon?: TriggersDaemon;
  readonly consolidatorDaemon?: ConsolidatorDaemon;
  readonly workflowTimerDaemon?: WorkflowTimerDaemon;
  readonly channelsDaemon?: ChannelsDaemon;
}

/** IP-23: is `host` a loopback interface (so an open /metrics is not exposed)? */
function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  return h === '127.0.0.1' || h === '::1' || h === '[::1]' || h === 'localhost';
}

export function mountRoutes(
  app: Hono<{ Variables: ServerVariables }>,
  config: ServerConfigSpec,
  ctx: MountRoutesContext,
): void {
  const base = config.server.basePath;
  const probes =
    ctx.healthProbes ??
    (() =>
      buildDefaultHealthProbes(
        ctx.store,
        ctx.triggersDaemon,
        ctx.consolidatorDaemon,
        ctx.wsDispatcher,
        config,
        ctx.workflowTimerDaemon,
        ctx.channelsDaemon,
      ));
  const health = createExtendedHealthRoutes({
    version: ctx.version,
    startedAt: ctx.startedAt,
    now: ctx.now,
    probes,
  });
  app.route(`${base}/health`, health);

  // IP-13: `auth.kind='none'` disables authentication on every route. It is the
  // documented trusted-loopback / single-operator mode, but binding a
  // non-loopback host with auth off exposes full admin access (including the WS
  // stream) to anyone who can reach it - warn loudly rather than silently.
  if (config.auth.kind === 'none' && !isLoopbackHost(config.server.host)) {
    console.warn(
      `[graphorin/server] WARN: auth.kind='none' disables authentication on every endpoint, ` +
        `but the server binds the non-loopback host '${config.server.host}'. Anyone who can reach ` +
        `it has full admin access - use auth.kind='token' for non-loopback deployments or bind a ` +
        `loopback host.`,
    );
  }

  // Auth + audit + idempotency for everything below this line - see
  // `app-middleware.ts` for the boundary semantics and skip list.
  const { anonymousAuth } = attachProtectedMiddleware(app, config, ctx);

  if (config.metrics.enabled) {
    // IP-23: an unauthenticated /metrics endpoint leaks operational intel
    // (trigger ids in labels, consolidator budgets). It is fine on a loopback
    // host, but binding a non-loopback host with auth off silently exposes it.
    if (!config.metrics.requireAuth && !isLoopbackHost(config.server.host)) {
      console.warn(
        `[graphorin/server] WARN: /metrics is unauthenticated (metrics.requireAuth=false) and ` +
          `the server binds the non-loopback host '${config.server.host}'. The exposition leaks ` +
          `operational detail to anyone who can reach it - set metrics.requireAuth=true or bind a ` +
          `loopback host.`,
      );
    }
    // E-03 (S-14b/17): mounted AFTER the auth middleware so the
    // `admin:metrics:read` scope check sees a verified token when
    // metrics.requireAuth=true. The requireAuth=false path stays
    // unauthenticated via the middleware's skip list.
    const metricsRoute = createMetricsRoutes({
      registry: ctx.metricRegistry,
      requireAuth: config.metrics.requireAuth,
      refresh: () =>
        refreshLiveMetrics({
          registry: ctx.metricRegistry,
          store: ctx.store,
          runs: ctx.runs,
          startedAt: ctx.startedAt,
          now: ctx.now,
          ...(ctx.triggersDaemon !== undefined ? { triggersDaemon: ctx.triggersDaemon } : {}),
          ...(ctx.consolidatorDaemon !== undefined
            ? { consolidatorDaemon: ctx.consolidatorDaemon }
            : {}),
          ...(ctx.wsDispatcher !== undefined ? { wsDispatcher: ctx.wsDispatcher } : {}),
        }),
    });
    app.route(`${base}${config.metrics.path}`, metricsRoute);
  }

  // Mounted AFTER the auth middleware so the scope check has a
  // verified token to inspect; the unauthenticated `/v1/health` GET
  // continues to serve the rollup.
  app.route(`${base}/health/secrets`, createSecretsHealthRoutes());

  app.route(
    `${base}/agents`,
    createAgentRoutes({
      agents: ctx.agents,
      runs: ctx.runs,
      // IP-2: the streaming dispatcher reaches the route layer.
      ...(ctx.wsDispatcher !== undefined ? { dispatcher: ctx.wsDispatcher } : {}),
    }),
  );
  app.route(`${base}/runs`, createRunRoutes({ agents: ctx.agents, runs: ctx.runs }));
  app.route(
    `${base}/workflows`,
    createWorkflowRoutes({
      workflows: ctx.workflows,
      runs: ctx.runs,
      ...(ctx.wsDispatcher !== undefined ? { dispatcher: ctx.wsDispatcher } : {}),
    }),
  );
  if (ctx.sessions !== undefined) {
    app.route(`${base}/sessions`, createSessionRoutes({ sessions: ctx.sessions }));
  }
  if (ctx.memory !== undefined) {
    app.route(`${base}/memory`, createMemoryRoutes({ memory: ctx.memory }));
  }
  if (ctx.skills !== undefined) {
    app.route(`${base}/skills`, createSkillsRoutes({ skills: ctx.skills }));
  }
  if (ctx.mcp !== undefined) {
    app.route(`${base}/mcp`, createMcpRoutes({ mcp: ctx.mcp }));
  }
  if (ctx.audit !== undefined) {
    app.route(`${base}/audit`, createAuditRoutes({ audit: ctx.audit }));
  }
  if (ctx.triggersDaemon !== undefined) {
    app.route(`${base}/triggers`, createTriggersRoutes({ daemon: ctx.triggersDaemon }));
  }
  if (ctx.replay !== undefined) {
    app.route(
      `${base}`,
      createReplayRoutes({
        replay: ctx.replay,
        ...(ctx.auditDb !== undefined ? { auditDb: ctx.auditDb } : {}),
        now: ctx.now,
      }),
    );
  }
  if (config.auth.kind === 'token' && ctx.pepper !== undefined) {
    app.route(
      `${base}/tokens`,
      createTokensRoutes({
        tokenStore: ctx.store.authTokens,
        pepper: ctx.pepper,
        defaultEnv: 'live',
        allowedEnvs: config.auth.tokenEnvironments,
      }),
    );
  }
  if (ctx.wsTickets !== undefined) {
    app.route(`${base}`, createAuthRoutes({ tickets: ctx.wsTickets }));
  }
  // IP-13: mount the WS upgrade when a verifier is wired OR auth is disabled
  // (`auth.kind='none'`). The old condition required a verifier, so
  // `ws.enabled: true` under no-auth was silently ignored - the route never
  // mounted and clients got a bare 404 with no explanation.
  if (
    ctx.wsDispatcher !== undefined &&
    ctx.wsTickets !== undefined &&
    ctx.wsAdapter !== undefined &&
    (ctx.verifier !== undefined || anonymousAuth) &&
    config.server.ws.enabled
  ) {
    const dispatcher = ctx.wsDispatcher;
    const tickets = ctx.wsTickets;
    const verifier = ctx.verifier;
    const runs = ctx.runs;
    app.get(
      `${base}${config.server.ws.path}`,
      ctx.wsAdapter.upgradeWebSocket((c) =>
        createWsUpgradeEvents(c, {
          dispatcher,
          tickets,
          ...(verifier !== undefined ? { verifier } : {}),
          anonymous: anonymousAuth,
          runs,
          now: ctx.now,
        }),
      ),
    );
  }
  if (ctx.wsDispatcher !== undefined && config.server.sse.enabled) {
    app.route(
      `${base}${config.server.sse.path}`,
      createSseRoutes({
        dispatcher: ctx.wsDispatcher,
        keepAliveMs: config.server.sse.keepAliveMs,
        // IP-9: bound the per-connection delivery queue.
        perConnectionQueueLimit: config.server.stream.perConnectionQueueLimit,
        now: ctx.now,
      }),
    );
  }
}

function buildDefaultHealthProbes(
  store: GraphorinSqliteStore,
  triggersDaemon: TriggersDaemon | undefined,
  consolidatorDaemon: ConsolidatorDaemon | undefined,
  dispatcher: WsDispatcher | undefined,
  config: ServerConfigSpec,
  workflowTimerDaemon?: WorkflowTimerDaemon,
  channelsDaemon?: ChannelsDaemon,
): HealthCheckOptions {
  const out: {
    -readonly [K in keyof HealthCheckOptions]?: HealthCheckOptions[K];
  } = {
    store,
    walWarnThresholdBytes: config.health.walWarnThresholdBytes,
    encryptionEnabled: config.storage.encryption.enabled,
    // IP-1: when this process built the encrypted store itself, the
    // keyed open at boot proved the cipher peer - report the fact.
    ...(config.storage.encryption.enabled ? { cipherPeerInstalled: true } : {}),
  };
  if (triggersDaemon !== undefined) out.triggers = triggersDaemon;
  if (consolidatorDaemon !== undefined) out.consolidator = consolidatorDaemon;
  if (workflowTimerDaemon !== undefined) out.workflowTimers = workflowTimerDaemon;
  if (channelsDaemon !== undefined) out.channels = channelsDaemon;
  if (dispatcher !== undefined) {
    const sizes = dispatcher.size();
    // The dispatcher only exposes (subscribers, subscriptions); the
    // per-subject replay-buffer occupancy is owned by each
    // subscription, not the dispatcher itself. Surface the active
    // subscription count as a usable proxy + the raw subscriber count
    // so operators can correlate.
    out.replayBuffer = {
      eventsBuffered: sizes.subscriptions,
      subscribers: sizes.subscribers,
      subscriptions: sizes.subscriptions,
    };
  }
  return Object.freeze(out as HealthCheckOptions);
}
