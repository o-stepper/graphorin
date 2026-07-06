/**
 * `createServer({...})` - the single programmatic entry point.
 *
 * The factory returns a {@link GraphorinServer} handle the operator
 * controls via `start()` / `stop()`. The same handle is consumed by
 * the `graphorin start` CLI binary in `@graphorin/cli`.
 *
 * Phase 14a covers the full HTTP surface, the lifecycle plumbing,
 * the Hono app composition, and the auth / scope / idempotency /
 * audit middleware stack. Phase 14b/c attach the WebSocket layer +
 * triggers daemon + observability endpoints to the same handle.
 *
 * This file is the composition root: the cohesive builders live in
 * focused sibling modules - `app-audit-binding.ts` (default audit-db
 * binding), `app-middleware.ts` (global + authenticated-subtree
 * middleware), `app-ws.ts` (WebSocket layer), `app-daemons.ts`
 * (triggers / consolidator daemon construction), `app-routes.ts`
 * (route mounting), `app-metrics.ts` (live scrape refresh), and
 * `app-lifecycle.ts` (`start()` / `stop()` sequencing).
 *
 * @packageDocumentation
 */

import process from 'node:process';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { Hono } from 'hono';
import { buildDaemons, type TriggersDaemonInput, type WorkflowTimersInput } from './app-daemons.js';
import { createLifecycle } from './app-lifecycle.js';
import { attachGlobalMiddleware } from './app-middleware.js';
import { buildWsLayer } from './app-ws.js';
import { parseServerConfig, type ServerConfigInput, type ServerConfigSpec } from './config.js';
import type { ConsolidatorDaemon, ConsolidatorLike } from './consolidator/daemon.js';
import { ConfigInvalidError } from './errors/index.js';
import type { HealthCheckOptions } from './health/index.js';
import type { ServerVariables } from './internal/context.js';
import type { LifecycleHooks } from './lifecycle/index.js';
import { createServerMetricRegistry, SERVER_METRIC_NAMES } from './metrics/catalog.js';
import type { MetricRegistry } from './metrics/registry.js';
import { AgentRegistry, WorkflowRegistry } from './registry/index.js';
import type { ReplayApi } from './replay/index.js';
import type { AuditApi, McpApi, MemoryApi, SessionApi, SkillsApi } from './routes/index.js';
import { RunStateTracker } from './runtime/run-state.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import type { WorkflowTimerDaemon } from './workflows/timer-daemon.js';
import type { WsDispatcher, WsTicketStore } from './ws/index.js';

// Stable re-exports - both were born in this module and stay
// importable from `./app.js` (and the package barrel) unchanged.
export { ensureStoreAuditBinding } from './app-audit-binding.js';
export type { TriggersDaemonInput, WorkflowTimersInput } from './app-daemons.js';

/**
 * Public surface returned by {@link createServer}.
 *
 * @stable
 */
export interface GraphorinServer {
  readonly version: string;
  readonly config: ServerConfigSpec;
  readonly app: Hono<{ Variables: ServerVariables }>;
  readonly agents: AgentRegistry;
  readonly workflows: WorkflowRegistry;
  readonly runs: RunStateTracker;
  readonly listeningOn: { readonly host: string; readonly port: number } | undefined;
  /**
   * Optional WebSocket dispatcher exposed when `server.ws.enabled =
   * true`. Route handlers + the agent / workflow runtimes call
   * `dispatcher.emit(subject, event)` to fan out events to subscribed
   * clients. Returns `undefined` when WS is disabled.
   */
  readonly wsDispatcher: WsDispatcher | undefined;
  /**
   * Optional WebSocket ticket store exposed when `server.ws.enabled
   * = true`. Surfaced primarily for tests; the
   * `POST /v1/session/ws-ticket` route uses it transparently.
   */
  readonly wsTickets: WsTicketStore | undefined;
  /**
   * Optional triggers daemon - populated when the operator wired a
   * scheduler (or an in-process trigger surface) at construction
   * time. Phase 14c integration.
   */
  readonly triggers: TriggersDaemon | undefined;
  /**
   * Optional consolidator daemon - populated when the operator
   * supplied a `Consolidator` instance via `createServer({
   * consolidator })`. Phase 14c integration.
   */
  readonly consolidator: ConsolidatorDaemon | undefined;
  /**
   * W-032: optional workflow durable-timer daemon - populated when the
   * operator wired a `createTimerDriver(...)` at construction time.
   */
  readonly workflowTimers: WorkflowTimerDaemon | undefined;
  /**
   * Phase 14c Prometheus registry. Always present; sample updates
   * are observable via `metrics.snapshot()`.
   */
  readonly metrics: MetricRegistry;
  start(): Promise<{ readonly host: string; readonly port: number }>;
  stop(options?: { readonly force?: boolean }): Promise<void>;
}

/**
 * @stable
 */
export interface CreateServerOptions {
  /** Loaded `graphorin.config.ts` payload - see `defineConfig({...})`. */
  readonly config?: ServerConfigInput;
  /**
   * Optional pre-validated config. When supplied, `config` is ignored
   * and the schema validation step is skipped. Useful for tests + the
   * `graphorin migrate` CLI command which bypasses the listener.
   */
  readonly validatedConfig?: ServerConfigSpec;
  /** Pre-built SQLite store. Tests inject an in-memory store. */
  readonly store?: GraphorinSqliteStore;
  /** Optional pre-built tracker. Tests inject deterministic timing. */
  readonly runs?: RunStateTracker;
  /** Optional pre-built registries. */
  readonly agents?: AgentRegistry;
  readonly workflows?: WorkflowRegistry;
  /** Optional in-process domain adapters wired into REST routes. */
  readonly sessions?: SessionApi;
  readonly memory?: MemoryApi;
  readonly skills?: SkillsApi;
  readonly mcp?: McpApi;
  readonly audit?: AuditApi;
  /**
   * Optional consolidator surface (`@graphorin/memory`). Phase 14c
   * starts/stops the runtime alongside the server lifecycle and
   * surfaces its status through `/v1/health`.
   */
  readonly consolidator?: ConsolidatorLike;
  /**
   * Optional triggers daemon - pass an existing one (e.g. built
   * from `createScheduler`) or a triggers configuration the server
   * should wrap with the daemon adapter.
   */
  readonly triggers?: TriggersDaemonInput;
  /**
   * W-032: optional workflow durable-timer surface - pass a
   * `createTimerDriver(...)` built over your workflows + checkpoint
   * stores (`{ driver }`), or a pre-built daemon. The server starts
   * and stops it with the lifecycle and reports it on `/v1/health`.
   */
  readonly workflowTimers?: WorkflowTimersInput;
  /**
   * Optional replay API consumed by the scope-enforced replay
   * endpoints. Phase 14c.
   */
  readonly replay?: ReplayApi;
  /**
   * Optional probes that augment `/v1/health`. Provided by consumer
   * code (e.g. `embedder` provides `embedderLoaded`).
   */
  readonly healthProbes?: () => HealthCheckOptions | Promise<HealthCheckOptions>;
  /**
   * Optional Prometheus metric registry override. When omitted, the
   * server constructs the canonical registry from
   * {@link createServerMetricRegistry}.
   */
  readonly metricRegistry?: MetricRegistry;
  /** Lifecycle hook overrides. */
  readonly hooks?: LifecycleHooks;
  /** Wall-clock provider for tests. */
  readonly now?: () => number;
  /** Override the cipher peer probe. Tests inject a stub. */
  readonly probeCipherPeer?: () => Promise<void>;
  /** Override the package version reported on `/v1/health`. */
  readonly version?: string;
  /** Skip `applyProcessHardening` (tests). */
  readonly skipHardening?: boolean;
  /** Skip starting the actual listener (tests). */
  readonly skipListen?: boolean;
}

/**
 * @stable
 */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

/**
 * Build a fully-wired Graphorin server. The returned handle is
 * inert until `start()` is awaited.
 *
 * @stable
 */
export async function createServer(options: CreateServerOptions = {}): Promise<GraphorinServer> {
  const config: ServerConfigSpec =
    options.validatedConfig ?? parseServerConfig(options.config ?? {});
  const now = options.now ?? Date.now;
  const startedAt = now();
  const version = options.version ?? VERSION;

  // IP-1: when encryption is configured, resolve the passphrase ref
  // BEFORE constructing the store and thread the encryption config
  // through - `graphorin init --encrypted` produced a config nothing
  // honoured, and a database encrypted via `storage encrypt` could not
  // be opened by the server at all.
  let storeEncryption:
    | { enabled: true; cipher?: never; passphraseResolver: () => Promise<string> }
    | undefined;
  if (options.store === undefined && config.storage.encryption.enabled) {
    if (config.storage.encryption.passphraseRef === undefined) {
      throw new Error(
        '[graphorin/server] storage.encryption.enabled is true but no passphraseRef is configured.',
      );
    }
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const passphrase = await resolveSecret(config.storage.encryption.passphraseRef);
    storeEncryption = {
      enabled: true,
      passphraseResolver: async () => passphrase.use((v) => v),
    } as never;
  }
  const store =
    options.store ??
    (await createSqliteStore({
      path: config.storage.path,
      mode: config.storage.mode,
      ...(storeEncryption !== undefined
        ? {
            encryption: {
              enabled: true,
              ...(config.storage.encryption.cipher !== undefined
                ? { cipher: config.storage.encryption.cipher as never }
                : {}),
              passphraseResolver: storeEncryption.passphraseResolver,
            },
          }
        : {}),
    }));

  const metricRegistry = options.metricRegistry ?? createServerMetricRegistry();
  metricRegistry.set(SERVER_METRIC_NAMES.buildInfo, 1, { version });

  // IP-15: agent / workflow run completions move graphorin_agent_runs_total +
  // graphorin_agent_run_duration_seconds. The tracker stays metric-agnostic -
  // it fires a terminal callback the server turns into samples.
  const runs =
    options.runs ??
    new RunStateTracker({
      now,
      onTerminal: (info) => {
        metricRegistry.inc(SERVER_METRIC_NAMES.agentRunsTotal, { status: info.status });
        if (info.durationMs !== undefined) {
          metricRegistry.observe(SERVER_METRIC_NAMES.agentRunDuration, info.durationMs / 1000);
        }
      },
    });
  const agents = options.agents ?? new AgentRegistry();
  const workflows = options.workflows ?? new WorkflowRegistry();

  const app = new Hono<{ Variables: ServerVariables }>();

  // Request-state / CORS / CSRF / rate-limit - see `app-middleware.ts`.
  attachGlobalMiddleware(app, config, now);

  const { triggersDaemon, consolidatorDaemon, workflowTimerDaemon } = buildDaemons(options);

  const ws = buildWsLayer(app, config, now);

  const lifecycle = createLifecycle({
    options,
    config,
    store,
    app,
    metricRegistry,
    runs,
    agents,
    workflows,
    version,
    startedAt,
    now,
    ws,
    triggersDaemon,
    consolidatorDaemon,
    workflowTimerDaemon,
  });

  const handle: GraphorinServer = {
    version,
    config,
    app,
    agents,
    workflows,
    runs,
    metrics: metricRegistry,
    get wsDispatcher() {
      return lifecycle.wsDispatcher;
    },
    get wsTickets() {
      return lifecycle.wsTickets;
    },
    get triggers() {
      return triggersDaemon;
    },
    get consolidator() {
      return consolidatorDaemon;
    },
    get workflowTimers() {
      return workflowTimerDaemon;
    },
    get listeningOn() {
      return lifecycle.listeningOn;
    },
    start: lifecycle.start,
    stop: lifecycle.stop,
  };
  return handle;
}

void process;
void ConfigInvalidError;
