/**
 * `createServer({...})` — the single programmatic entry point.
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
 * @packageDocumentation
 */

import type { AddressInfo } from 'node:net';
import process from 'node:process';
import { negotiateSubprotocol, SUBPROTOCOL_NAME } from '@graphorin/protocol';
import { applyProcessHardening, generatePepper, TokenVerifier } from '@graphorin/security';
import { type AuditDb, openAuditDb, registerAuditDbBinding } from '@graphorin/security/audit';
import {
  createSqliteStore,
  type GraphorinSqliteStore,
  loadCipherDriver,
  readWalSize,
} from '@graphorin/store-sqlite';
import { type ServerType, serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { parseServerConfig, type ServerConfigInput, type ServerConfigSpec } from './config.js';
import type { ConsolidatorDaemon, ConsolidatorLike } from './consolidator/daemon.js';
import { createConsolidatorDaemon } from './consolidator/daemon.js';
import {
  ConfigInvalidError,
  LifecycleDoubleStartError,
  LifecycleNotStartedError,
  ShutdownTimeoutError,
} from './errors/index.js';
import {
  createExtendedHealthRoutes,
  createMetricsRoutes,
  createSecretsHealthRoutes,
  type HealthCheckOptions,
} from './health/index.js';
import type { ServerVariables } from './internal/context.js';
import { type LifecycleHooks, type OnErrorContext, runPreBind } from './lifecycle/index.js';
import { createServerMetricRegistry, SERVER_METRIC_NAMES } from './metrics/catalog.js';
import type { MetricRegistry } from './metrics/registry.js';
import {
  createAuditMiddleware,
  createAuthMiddleware,
  createCorsMiddleware,
  createCsrfMiddleware,
  createIdempotencyMiddleware,
  createRateLimitMiddleware,
  createRequestStateMiddleware,
} from './middleware/index.js';
import { AgentRegistry, WorkflowRegistry } from './registry/index.js';
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
import { RunStateTracker } from './runtime/run-state.js';
import { createSseRoutes } from './sse/index.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import { createTriggersDaemon } from './triggers/daemon.js';
import { createTriggersRoutes } from './triggers/routes.js';
import {
  createWsDispatcher,
  createWsTicketStore,
  type WsDispatcher,
  type WsTicketStore,
} from './ws/index.js';
import { createWsUpgradeEvents } from './ws/upgrade.js';

/**
 * Pre-built audit-db binding shipped from `@graphorin/store-sqlite`.
 * Registered exactly once per process so {@link openAuditDb} can find
 * a default binding without forcing operators to wire it manually.
 *
 * Exported as {@link ensureStoreAuditBinding} so the CLI (Phase 15
 * `graphorin audit verify | prune | export`) can reach into the same
 * binding without booting the HTTP listener.
 *
 * @stable
 */
let storeAuditBindingRegistered = false;
export function ensureStoreAuditBinding(): void {
  if (storeAuditBindingRegistered) return;
  registerAuditDbBinding(
    {
      id: 'better-sqlite3-multiple-ciphers',
      description: 'Default audit-db binding shipped by @graphorin/store-sqlite.',
      open: async (opts) => {
        const driver = await loadCipherDriver();
        const passphrase = await opts.passphrase.use((value) => value);
        const Db = driver as unknown as new (
          path: string,
        ) => {
          pragma(s: string): unknown;
          prepare(sql: string): {
            run(...args: unknown[]): unknown;
            get(...args: unknown[]): unknown;
            all(...args: unknown[]): unknown;
            iterate(...args: unknown[]): IterableIterator<unknown>;
          };
          exec(sql: string): unknown;
          close(): void;
          open: boolean;
        };
        const db = new Db(opts.path);
        db.pragma(`key = '${passphrase.replace(/'/g, "''")}'`);
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('busy_timeout = 5000');
        db.pragma('foreign_keys = ON');
        db.exec(
          `CREATE TABLE IF NOT EXISTS audit_log (
            seq INTEGER PRIMARY KEY,
            ts INTEGER NOT NULL,
            actor_json TEXT NOT NULL,
            action TEXT NOT NULL,
            target TEXT NOT NULL,
            decision TEXT NOT NULL,
            context_json TEXT,
            metadata_json TEXT,
            prev_hash TEXT NOT NULL,
            hash TEXT NOT NULL UNIQUE
          ) WITHOUT ROWID;`,
        );
        return {
          binding: 'better-sqlite3-multiple-ciphers',
          path: opts.path,
          async insert(entry) {
            db.prepare(
              `INSERT INTO audit_log (
                 seq, ts, actor_json, action, target, decision,
                 context_json, metadata_json, prev_hash, hash
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ).run(
              entry.seq,
              entry.ts,
              JSON.stringify(entry.actor),
              entry.action,
              entry.target,
              entry.decision,
              entry.context !== undefined ? JSON.stringify(entry.context) : null,
              entry.metadata !== undefined ? JSON.stringify(entry.metadata) : null,
              entry.prevHash,
              entry.hash,
            );
            return entry;
          },
          async latest() {
            const row = db.prepare('SELECT * FROM audit_log ORDER BY seq DESC LIMIT 1').get() as
              | undefined
              | {
                  seq: number;
                  ts: number;
                  actor_json: string;
                  action: string;
                  target: string;
                  decision: string;
                  context_json: string | null;
                  metadata_json: string | null;
                  prev_hash: string;
                  hash: string;
                };
            if (row === undefined) return undefined;
            return rowToEntry(row);
          },
          async *iterate(bounds) {
            const lo = bounds?.fromSeq ?? 1;
            const hi = bounds?.toSeq ?? Number.MAX_SAFE_INTEGER;
            const iter = db
              .prepare('SELECT * FROM audit_log WHERE seq BETWEEN ? AND ? ORDER BY seq ASC')
              .iterate(lo, hi);
            for (const row of iter) yield rowToEntry(row as Parameters<typeof rowToEntry>[0]);
          },
          async count() {
            const row = db.prepare('SELECT COUNT(*) AS n FROM audit_log').get() as { n: number };
            return row.n;
          },
          async deleteUpTo(threshold) {
            const before = db
              .prepare('SELECT COUNT(*) AS n FROM audit_log WHERE seq <= ?')
              .get(threshold) as { n: number };
            db.prepare('DELETE FROM audit_log WHERE seq <= ?').run(threshold);
            return before.n;
          },
          async replaceEntry(entry) {
            db.prepare(`UPDATE audit_log SET prev_hash = ?, hash = ? WHERE seq = ?`).run(
              entry.prevHash,
              entry.hash,
              entry.seq,
            );
          },
          async close() {
            if (db.open) db.close();
          },
        };
      },
    },
    { setAsDefault: true },
  );
  storeAuditBindingRegistered = true;
}

function rowToEntry(row: {
  seq: number;
  ts: number;
  actor_json: string;
  action: string;
  target: string;
  decision: string;
  context_json: string | null;
  metadata_json: string | null;
  prev_hash: string;
  hash: string;
}) {
  return {
    seq: row.seq,
    ts: row.ts,
    actor: JSON.parse(row.actor_json),
    action: row.action,
    target: row.target,
    decision: row.decision as 'success' | 'denied' | 'error' | 'not-found',
    ...(row.context_json !== null ? { context: JSON.parse(row.context_json) } : {}),
    ...(row.metadata_json !== null ? { metadata: JSON.parse(row.metadata_json) } : {}),
    prevHash: row.prev_hash,
    hash: row.hash,
  };
}

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
   * Optional triggers daemon — populated when the operator wired a
   * scheduler (or an in-process trigger surface) at construction
   * time. Phase 14c integration.
   */
  readonly triggers: TriggersDaemon | undefined;
  /**
   * Optional consolidator daemon — populated when the operator
   * supplied a `Consolidator` instance via `createServer({
   * consolidator })`. Phase 14c integration.
   */
  readonly consolidator: ConsolidatorDaemon | undefined;
  /**
   * Phase 14c Prometheus registry. Always present; sample updates
   * are observable via `metrics.snapshot()`.
   */
  readonly metrics: MetricRegistry;
  start(): Promise<{ readonly host: string; readonly port: number }>;
  stop(options?: { readonly force?: boolean }): Promise<void>;
}

/**
 * Discriminated union accepted by `CreateServerOptions.triggers`. A
 * caller may either supply a fully-built daemon (e.g. constructed
 * around a custom `Scheduler`) or just the underlying scheduler — the
 * server wraps it with {@link createTriggersDaemon} automatically.
 *
 * @stable
 */
export type TriggersDaemonInput =
  | { readonly daemon: TriggersDaemon }
  | { readonly scheduler: import('@graphorin/triggers').Scheduler };

/**
 * @stable
 */
export interface CreateServerOptions {
  /** Loaded `graphorin.config.ts` payload — see `defineConfig({...})`. */
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
   * Optional triggers daemon — pass an existing one (e.g. built
   * from `createScheduler`) or a triggers configuration the server
   * should wrap with the daemon adapter.
   */
  readonly triggers?: TriggersDaemonInput;
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
export const VERSION = '0.4.0';

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
  // through — `graphorin init --encrypted` produced a config nothing
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

  const runs = options.runs ?? new RunStateTracker({ now });
  const agents = options.agents ?? new AgentRegistry();
  const workflows = options.workflows ?? new WorkflowRegistry();

  const app = new Hono<{ Variables: ServerVariables }>();

  // Global middleware in the documented order. Per-route scope +
  // idempotency layers are mounted by the route factories so the
  // composition stays declarative + auditable.
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

  let serverInstance: ServerType | undefined;
  let listening: { readonly host: string; readonly port: number } | undefined;
  let started = false;
  let stopped = false;
  let auditDb: AuditDb | undefined;
  let preBind: Awaited<ReturnType<typeof runPreBind>> | undefined;
  let verifier: TokenVerifier | undefined;
  let pepperHandle: import('@graphorin/security').SecretValue | undefined;

  const metricRegistry = options.metricRegistry ?? createServerMetricRegistry();
  metricRegistry.set(SERVER_METRIC_NAMES.buildInfo, 1, { version });

  let triggersDaemon: TriggersDaemon | undefined;
  if (options.triggers !== undefined) {
    if ('daemon' in options.triggers) {
      triggersDaemon = options.triggers.daemon;
    } else {
      triggersDaemon = createTriggersDaemon({ scheduler: options.triggers.scheduler });
    }
  }
  let consolidatorDaemon: ConsolidatorDaemon | undefined;
  if (options.consolidator !== undefined) {
    consolidatorDaemon = createConsolidatorDaemon({ consolidator: options.consolidator });
  }

  let dispatcher: WsDispatcher | undefined;
  let tickets: WsTicketStore | undefined;
  let wsAdapter: ReturnType<typeof createNodeWebSocket> | undefined;
  if (config.server.ws.enabled) {
    dispatcher = createWsDispatcher({
      commentary: {
        policy: config.server.ws.commentarySanitization.policy,
        applyToEvents: config.server.ws.commentarySanitization.applyToEvents,
      },
      replayBuffer: {
        maxEvents: config.server.stream.replayBuffer.maxEvents,
        ttlMs: config.server.stream.replayBuffer.ttlSeconds * 1000,
      },
      perConnectionQueueLimit: config.server.stream.perConnectionQueueLimit,
      now,
    });
    tickets = createWsTicketStore({
      ttlMs: config.server.ws.ticketTtlMs,
      now,
    });
    wsAdapter = createNodeWebSocket({ app });
    // The WS server inside @hono/node-ws is created without any
    // subprotocol-negotiation policy; without one, the `ws` library
    // never echoes back `Sec-WebSocket-Protocol` and clients that
    // advertised a subprotocol close the connection immediately.
    // Mutate the options to install a Graphorin-aware policy that
    // selects `graphorin.protocol.v1` when the client offered it.
    const wssOptions = (
      wsAdapter.wss as unknown as {
        options: {
          handleProtocols?: (
            protocols: Set<string>,
            request: import('node:http').IncomingMessage,
          ) => string | false;
        };
      }
    ).options;
    wssOptions.handleProtocols = (protocols) => {
      const negotiated = negotiateSubprotocol(Array.from(protocols));
      if (negotiated !== null) return negotiated;
      // Browser ticket flow: the `WebSocket` constructor cannot set an
      // `Authorization` header, so the browser client offers two
      // subprotocol tokens — the canonical `graphorin.protocol.v1`
      // name plus a `ticket.<value>` token (see the wire contract in
      // `@graphorin/protocol`'s `subprotocol.ts`:
      // `SUBPROTOCOL_NAME` / `TICKET_SUBPROTOCOL_PREFIX` /
      // `parseTicketSubprotocol`). The server MUST echo back exactly
      // the canonical name (never the `ticket.*` token) so the
      // handshake's `Sec-WebSocket-Protocol` response stays valid; the
      // ticket value is consumed separately by `createWsUpgradeEvents`
      // via `parseTicketSubprotocol` and exchanged through the
      // single-use `WsTicketStore`.
      for (const candidate of protocols) {
        if (candidate === SUBPROTOCOL_NAME) return SUBPROTOCOL_NAME;
      }
      return false;
    };
  }

  const handle: GraphorinServer = {
    version,
    config,
    app,
    agents,
    workflows,
    runs,
    metrics: metricRegistry,
    get wsDispatcher() {
      return dispatcher;
    },
    get wsTickets() {
      return tickets;
    },
    get triggers() {
      return triggersDaemon;
    },
    get consolidator() {
      return consolidatorDaemon;
    },
    get listeningOn() {
      return listening;
    },
    async start(): Promise<{ readonly host: string; readonly port: number }> {
      if (started) throw new LifecycleDoubleStartError();
      started = true;
      try {
        if (options.hooks?.beforeStart !== undefined) {
          await options.hooks.beforeStart({ config });
        }
        if (options.skipHardening !== true && config.hardening.applyOnStart) {
          applyProcessHardening({
            refuseRoot: config.hardening.refuseRoot,
            umask: config.hardening.umask,
          });
        }
        preBind = await runPreBind({
          config,
          store,
          ...(options.probeCipherPeer !== undefined
            ? { probeCipherPeer: options.probeCipherPeer }
            : {}),
        });

        if (
          config.audit.enabled &&
          preBind.auditPassphrase !== undefined &&
          preBind.auditPath !== undefined
        ) {
          ensureStoreAuditBinding();
          auditDb = await openAuditDb({
            path: preBind.auditPath,
            passphrase: preBind.auditPassphrase,
            ...(config.audit.cipher !== undefined ? { cipher: config.audit.cipher } : {}),
          });
        }

        if (config.auth.kind === 'token') {
          const pepper = preBind.pepper ?? (await fallbackPepper(options.skipHardening === true));
          pepperHandle = pepper;
          verifier = new TokenVerifier({
            tokenStore: store.authTokens,
            pepper,
            acceptPrefix: config.auth.tokenPrefix,
            acceptEnvironments: config.auth.tokenEnvironments,
            ...(config.auth.perIpFailureThreshold !== undefined
              ? { perIpFailureThreshold: config.auth.perIpFailureThreshold }
              : {}),
            ...(config.auth.perIpLockoutMs !== undefined
              ? { perIpLockoutMs: config.auth.perIpLockoutMs }
              : {}),
            now,
          });
        }

        mountRoutes(app, config, {
          version,
          startedAt,
          now,
          agents,
          workflows,
          runs,
          store,
          metricRegistry,
          ...(options.sessions !== undefined ? { sessions: options.sessions } : {}),
          ...(options.memory !== undefined ? { memory: options.memory } : {}),
          ...(options.skills !== undefined ? { skills: options.skills } : {}),
          ...(options.mcp !== undefined ? { mcp: options.mcp } : {}),
          ...(options.audit !== undefined ? { audit: options.audit } : {}),
          ...(options.replay !== undefined ? { replay: options.replay } : {}),
          ...(options.healthProbes !== undefined ? { healthProbes: options.healthProbes } : {}),
          ...(verifier !== undefined ? { verifier } : {}),
          ...(auditDb !== undefined ? { auditDb } : {}),
          ...(pepperHandle !== undefined ? { pepper: pepperHandle } : {}),
          ...(dispatcher !== undefined ? { wsDispatcher: dispatcher } : {}),
          ...(tickets !== undefined ? { wsTickets: tickets } : {}),
          ...(wsAdapter !== undefined ? { wsAdapter } : {}),
          ...(triggersDaemon !== undefined ? { triggersDaemon } : {}),
          ...(consolidatorDaemon !== undefined ? { consolidatorDaemon } : {}),
        });

        // Start the consolidator first so it is ready to handle fired
        // triggers, bridge its cron / idle triggers onto the scheduler
        // (MCON-4 — without this nothing pipes triggers into the
        // consolidator and background consolidation never runs), then start
        // the scheduler last so it only fires fully-wired triggers.
        if (consolidatorDaemon !== undefined) {
          await consolidatorDaemon.start();
          if (
            triggersDaemon !== undefined &&
            consolidatorDaemon.consolidator.registerWithScheduler !== undefined
          ) {
            await consolidatorDaemon.consolidator.registerWithScheduler(triggersDaemon.scheduler);
          }
        }
        if (triggersDaemon !== undefined) {
          await triggersDaemon.start();
        }

        // Sample a couple of gauges immediately so the very first
        // `/v1/metrics` scrape after start carries non-zero data.
        try {
          const wal = readWalSize(store.connection);
          metricRegistry.set(SERVER_METRIC_NAMES.storageWalSize, wal);
        } catch {
          // Best-effort.
        }
        metricRegistry.set(
          SERVER_METRIC_NAMES.serverUptime,
          Math.max(0, Math.floor((now() - startedAt) / 1000)),
        );
        metricRegistry.set(SERVER_METRIC_NAMES.inflightRuns, runs.runningCount());
        metricRegistry.set(SERVER_METRIC_NAMES.replayBufferEvents, 0);

        if (options.skipListen !== true) {
          serverInstance = serve({
            fetch: app.fetch.bind(app),
            hostname: config.server.host,
            port: config.server.port,
          });
          if (wsAdapter !== undefined && serverInstance !== undefined) {
            wsAdapter.injectWebSocket(serverInstance);
          }
          await new Promise<void>((resolve) => {
            const server = serverInstance as unknown as {
              once(event: 'listening', cb: () => void): void;
            };
            if ('once' in server && typeof server.once === 'function') {
              server.once('listening', () => resolve());
            } else {
              // serve(...) returned a Node http.Server already bound.
              setImmediate(() => resolve());
            }
          });
          const address = (
            serverInstance as unknown as { address(): AddressInfo | string | null }
          ).address();
          if (address !== null && typeof address === 'object') {
            listening = { host: address.address, port: address.port };
          } else {
            listening = { host: config.server.host, port: config.server.port };
          }
        } else {
          listening = { host: config.server.host, port: config.server.port };
        }

        if (options.hooks?.onReady !== undefined) {
          await options.hooks.onReady({ config, listeningOn: listening });
        }
        return listening;
      } catch (err) {
        started = false;
        await emitError(options.hooks, { error: err, phase: 'beforeStart' });
        throw err;
      }
    },
    async stop({ force }: { readonly force?: boolean } = {}): Promise<void> {
      if (!started) throw new LifecycleNotStartedError();
      if (stopped) return;
      stopped = true;
      const drainTimeoutMs = force === true ? 0 : config.server.shutdown.drainTimeoutMs;
      try {
        if (options.hooks?.beforeShutdown !== undefined) {
          await options.hooks.beforeShutdown({
            config,
            inflight: runs.inflightCount(),
            drainTimeoutMs,
          });
        }
      } catch (err) {
        await emitError(options.hooks, { error: err, phase: 'beforeShutdown' });
      }

      if (triggersDaemon !== undefined) {
        try {
          await triggersDaemon.stop();
        } catch (err) {
          await emitError(options.hooks, { error: err, phase: 'beforeShutdown' });
        }
      }
      if (consolidatorDaemon !== undefined) {
        try {
          await consolidatorDaemon.stop();
        } catch (err) {
          await emitError(options.hooks, { error: err, phase: 'beforeShutdown' });
        }
      }

      // Pending reservations (e.g. awaited WS subscriptions for the
      // streaming endpoints) hold no work in progress; abort them
      // immediately so the drain only waits for live runs.
      runs.abortPending('server-shutdown');
      const drained = await drainInFlight(runs, drainTimeoutMs, now);
      if (!drained && drainTimeoutMs > 0) {
        // Force-abort everything that didn't drain in time.
        runs.abortAll(new ShutdownTimeoutError(drainTimeoutMs, runs.runningCount()));
      }

      if (dispatcher !== undefined) {
        try {
          dispatcher.shutdown();
        } catch {
          // Best-effort during stop().
        }
      }

      if (serverInstance !== undefined) {
        await new Promise<void>((resolve) => {
          (serverInstance as unknown as { close(cb: () => void): void }).close(() => resolve());
        });
        serverInstance = undefined;
      }
      if (auditDb !== undefined) {
        await auditDb.close();
        auditDb = undefined;
      }
      await store.close();
      listening = undefined;
      verifier = undefined;
      started = false;
      preBind = undefined;
      dispatcher = undefined;
      tickets = undefined;
      wsAdapter = undefined;
    },
  };
  return handle;
}

interface MountRoutesContext {
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
}

function mountRoutes(
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
      ));
  const health = createExtendedHealthRoutes({
    version: ctx.version,
    startedAt: ctx.startedAt,
    now: ctx.now,
    probes,
  });
  app.route(`${base}/health`, health);

  if (config.metrics.enabled) {
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

  // Authenticated subtree begins here. The health endpoint above is
  // intentionally outside the auth boundary so liveness probes work
  // before the token verifier is wired. The WebSocket upgrade path is
  // also exempt: the upgrade handler in `ws/upgrade.ts` performs its
  // own bearer + ticket validation inline (the HTTP auth middleware
  // would otherwise short-circuit the upgrade with a 401 response
  // before the handler can negotiate the subprotocol).
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
  if (ctx.verifier !== undefined) {
    const verifier = ctx.verifier;
    const authMw = createAuthMiddleware({ verifier });
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

  // Idempotency middleware — applied to side-effecting endpoints. We
  // mount it once on the authenticated subtree so handlers don't have
  // to duplicate the configuration per-route.
  if (config.server.idempotency.enabled) {
    const idempotencyMw = createIdempotencyMiddleware({
      store: ctx.store.idempotency,
      config: config.server.idempotency,
      now: ctx.now,
      // IP-6: token minting returns a raw secret — never cache it.
      excludeResponseCachePaths: [`${base}/tokens`],
    });
    app.use(`${base}/*`, async (c, next) => {
      if (shouldSkipAuth(c.req.path)) {
        await next();
        return;
      }
      return idempotencyMw(c, next);
    });
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
  if (
    ctx.wsDispatcher !== undefined &&
    ctx.wsTickets !== undefined &&
    ctx.wsAdapter !== undefined &&
    ctx.verifier !== undefined &&
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
          verifier,
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

async function drainInFlight(
  runs: RunStateTracker,
  drainTimeoutMs: number,
  now: () => number,
): Promise<boolean> {
  if (runs.runningCount() === 0) return true;
  if (drainTimeoutMs <= 0) return runs.runningCount() === 0;
  const deadline = now() + drainTimeoutMs;
  while (now() < deadline) {
    if (runs.runningCount() === 0) return true;
    await new Promise((resolve) => setTimeout(resolve, Math.min(50, deadline - now())));
  }
  return runs.runningCount() === 0;
}

async function emitError(hooks: LifecycleHooks | undefined, ctx: OnErrorContext): Promise<void> {
  if (hooks?.onError === undefined) return;
  try {
    await hooks.onError(ctx);
  } catch {
    // onError must never throw further; swallow.
  }
}

interface RefreshLiveMetricsOptions {
  readonly registry: MetricRegistry;
  readonly store: GraphorinSqliteStore;
  readonly runs: RunStateTracker;
  readonly startedAt: number;
  readonly now: () => number;
  readonly triggersDaemon?: TriggersDaemon;
  readonly consolidatorDaemon?: ConsolidatorDaemon;
  readonly wsDispatcher?: WsDispatcher;
}

async function refreshLiveMetrics(options: RefreshLiveMetricsOptions): Promise<void> {
  const { registry, store, runs, startedAt, now } = options;

  try {
    const wal = readWalSize(store.connection);
    registry.set(SERVER_METRIC_NAMES.storageWalSize, wal);
  } catch {
    // Best-effort.
  }

  registry.set(
    SERVER_METRIC_NAMES.serverUptime,
    Math.max(0, Math.floor((now() - startedAt) / 1000)),
  );
  registry.set(SERVER_METRIC_NAMES.inflightRuns, runs.runningCount());

  if (options.wsDispatcher !== undefined) {
    const sizes = options.wsDispatcher.size();
    registry.set(SERVER_METRIC_NAMES.replayBufferEvents, sizes.subscriptions);
  }

  if (options.triggersDaemon !== undefined) {
    const metrics = options.triggersDaemon.metrics();
    for (const [triggerId, counts] of metrics.fires) {
      const sanitized = sanitizeMetricLabelValue(triggerId);
      const successCurrent = readCounter(registry, SERVER_METRIC_NAMES.triggersFiresTotal, {
        trigger_id: sanitized,
        status: 'success',
      });
      const errorCurrent = readCounter(registry, SERVER_METRIC_NAMES.triggersFiresTotal, {
        trigger_id: sanitized,
        status: 'error',
      });
      const successDelta = counts.success - successCurrent;
      const errorDelta = counts.error - errorCurrent;
      if (successDelta > 0) {
        registry.inc(
          SERVER_METRIC_NAMES.triggersFiresTotal,
          { trigger_id: sanitized, status: 'success' },
          successDelta,
        );
      }
      if (errorDelta > 0) {
        registry.inc(
          SERVER_METRIC_NAMES.triggersFiresTotal,
          { trigger_id: sanitized, status: 'error' },
          errorDelta,
        );
      }
    }
  }

  if (options.consolidatorDaemon !== undefined) {
    try {
      const status = await options.consolidatorDaemon.status();
      registry.set(SERVER_METRIC_NAMES.consolidatorQueueDepth, status.queueDepth, {
        phase: 'aggregate',
      });
      registry.set(SERVER_METRIC_NAMES.consolidatorDlqSize, status.dlqSize);
      registry.set(SERVER_METRIC_NAMES.consolidatorBudgetRemainingUsd, status.budget.costRemaining);
      registry.set(
        SERVER_METRIC_NAMES.consolidatorBudgetRemainingTokens,
        status.budget.tokensRemaining,
      );
    } catch {
      // Best-effort.
    }
  }
}

/**
 * Convert an arbitrary user-supplied identifier (trigger id) into a
 * Prometheus-safe label value. Replaces every character outside the
 * `[A-Za-z0-9_:]` range with `_`. This guarantees the cardinality
 * never explodes on UTF-8 sequences while keeping the value
 * recognizable.
 */
function sanitizeMetricLabelValue(value: string): string {
  return value.replace(/[^A-Za-z0-9_:.-]/g, '_').slice(0, 200);
}

function readCounter(
  registry: MetricRegistry,
  name: string,
  labels: Record<string, string>,
): number {
  const snap = registry.snapshot().counters[name] ?? [];
  for (const entry of snap) {
    if (matchesLabels(entry.labels, labels)) return entry.value;
  }
  return 0;
}

function matchesLabels(
  a: Record<string, string | number | boolean>,
  b: Record<string, string>,
): boolean {
  for (const k of Object.keys(b)) {
    if (String(a[k]) !== b[k]) return false;
  }
  for (const k of Object.keys(a)) {
    if (!(k in b)) return false;
  }
  return true;
}

function buildDefaultHealthProbes(
  store: GraphorinSqliteStore,
  triggersDaemon: TriggersDaemon | undefined,
  consolidatorDaemon: ConsolidatorDaemon | undefined,
  dispatcher: WsDispatcher | undefined,
  config: ServerConfigSpec,
): HealthCheckOptions {
  const out: {
    -readonly [K in keyof HealthCheckOptions]?: HealthCheckOptions[K];
  } = {
    store,
    walWarnThresholdBytes: config.health.walWarnThresholdBytes,
    encryptionEnabled: config.storage.encryption.enabled,
    // IP-1: when this process built the encrypted store itself, the
    // keyed open at boot proved the cipher peer — report the fact.
    ...(config.storage.encryption.enabled ? { cipherPeerInstalled: true } : {}),
  };
  if (triggersDaemon !== undefined) out.triggers = triggersDaemon;
  if (consolidatorDaemon !== undefined) out.consolidator = consolidatorDaemon;
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

async function fallbackPepper(skipHardening: boolean) {
  // Test-only path: when `skipHardening` is set we mint an ephemeral
  // pepper so the verifier is constructible without a real keyring.
  if (!skipHardening) {
    throw new Error(
      '[graphorin/server] missing resolved pepper after pre-bind; auth.pepperRef is required when auth.kind = token.',
    );
  }
  return generatePepper();
}

void process;
void ConfigInvalidError;
