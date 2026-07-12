/**
 * Lifecycle for `createServer({...})` - the `start()` / `stop()` pair
 * behind the {@link GraphorinServer} handle: beforeStart hook, process
 * hardening, pre-bind validation + migrations, audit-chain open,
 * token-verifier construction, route mounting, daemon start order
 * (consolidator first, scheduler last), listener bind, onReady, and
 * the mirrored shutdown sequence (drain, force-abort, dispatcher
 * shutdown, listener close, audit close, owned-store close -
 * caller-injected stores are never closed).
 *
 * The sequencing in this module is part of the documented contract -
 * pure movement only, do not reorder.
 *
 * @packageDocumentation
 */

import type { AddressInfo } from 'node:net';
import { applyProcessHardening, generatePepper, TokenVerifier } from '@graphorin/security';
import { type AuditDb, openAuditDb } from '@graphorin/security/audit';
import { type GraphorinSqliteStore, readWalSize } from '@graphorin/store-sqlite';
import { type ServerType, serve } from '@hono/node-server';
import type { Hono } from 'hono';
import { ensureStoreAuditBinding } from './app-audit-binding.js';
import { mountRoutes } from './app-routes.js';
import type { WsLayer } from './app-ws.js';
import type { ChannelsDaemon } from './channels/daemon.js';
import { bridgeCommentaryToAudit } from './commentary/index.js';
import type { ServerConfigSpec } from './config.js';
import type { ConsolidatorDaemon } from './consolidator/daemon.js';
import {
  LifecycleDoubleStartError,
  LifecycleNotStartedError,
  ShutdownTimeoutError,
} from './errors/index.js';
import type { HealthCheckOptions } from './health/index.js';
import type { ServerVariables } from './internal/context.js';
import { type LifecycleHooks, type OnErrorContext, runPreBind } from './lifecycle/index.js';
import { SERVER_METRIC_NAMES } from './metrics/catalog.js';
import type { MetricRegistry } from './metrics/registry.js';
import type { AgentRegistry, WorkflowRegistry } from './registry/index.js';
import type { ReplayApi } from './replay/index.js';
import type { AuditApi, McpApi, MemoryApi, SessionApi, SkillsApi } from './routes/index.js';
import { createConsoleRetentionLog, scheduleRetentionSweeps } from './runtime/retention.js';
import { type RunStateTracker, scheduleRunPruning } from './runtime/run-state.js';
import { bridgeToolAuditToAudit, type ToolAuditBridge } from './tools-audit-bridge.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import type { WorkflowTimerDaemon } from './workflows/timer-daemon.js';
import type { WsDispatcher, WsTicketStore } from './ws/index.js';
import { scheduleReplayBufferPruning } from './ws/replay-buffer.js';

/**
 * Subset of `CreateServerOptions` the lifecycle reads - hooks, test
 * escape hatches, and the domain adapters threaded into the routes.
 */
export interface ServerLifecycleOptions {
  readonly sessions?: SessionApi | undefined;
  readonly memory?: MemoryApi | undefined;
  readonly skills?: SkillsApi | undefined;
  readonly mcp?: McpApi | undefined;
  readonly audit?: AuditApi | undefined;
  readonly replay?: ReplayApi | undefined;
  readonly healthProbes?: (() => HealthCheckOptions | Promise<HealthCheckOptions>) | undefined;
  readonly hooks?: LifecycleHooks | undefined;
  readonly probeCipherPeer?: (() => Promise<void>) | undefined;
  readonly skipHardening?: boolean | undefined;
  readonly skipListen?: boolean | undefined;
}

/** Everything {@link createLifecycle} needs from the composition root. */
export interface ServerLifecycleDeps {
  readonly options: ServerLifecycleOptions;
  readonly config: ServerConfigSpec;
  readonly store: GraphorinSqliteStore;
  /**
   * E-21 (S-24/16): true when `createServer` built the store itself.
   * `stop()` only closes owned stores - a caller-injected store stays
   * open so it can be reused (e.g. the documented restartFactory
   * pattern).
   */
  readonly ownsStore: boolean;
  readonly app: Hono<{ Variables: ServerVariables }>;
  readonly metricRegistry: MetricRegistry;
  readonly runs: RunStateTracker;
  readonly agents: AgentRegistry;
  readonly workflows: WorkflowRegistry;
  readonly version: string;
  readonly startedAt: number;
  readonly now: () => number;
  readonly ws: WsLayer;
  readonly triggersDaemon: TriggersDaemon | undefined;
  readonly consolidatorDaemon: ConsolidatorDaemon | undefined;
  readonly workflowTimerDaemon: WorkflowTimerDaemon | undefined;
  readonly channelsDaemon: ChannelsDaemon | undefined;
}

/**
 * The stateful `start()` / `stop()` pair plus the live views the
 * {@link GraphorinServer} getters expose (`listeningOn`,
 * `wsDispatcher`, `wsTickets` are cleared during `stop()`).
 */
export interface ServerLifecycle {
  readonly listeningOn: { readonly host: string; readonly port: number } | undefined;
  readonly wsDispatcher: WsDispatcher | undefined;
  readonly wsTickets: WsTicketStore | undefined;
  start(): Promise<{ readonly host: string; readonly port: number }>;
  stop(options?: { readonly force?: boolean }): Promise<void>;
}

export function createLifecycle(deps: ServerLifecycleDeps): ServerLifecycle {
  const {
    options,
    config,
    store,
    ownsStore,
    app,
    metricRegistry,
    runs,
    agents,
    workflows,
    version,
    startedAt,
    now,
    triggersDaemon,
    consolidatorDaemon,
    workflowTimerDaemon,
    channelsDaemon,
  } = deps;
  const commentaryAuditSink = deps.ws.commentaryAuditSink;

  let serverInstance: ServerType | undefined;
  let listening: { readonly host: string; readonly port: number } | undefined;
  let started = false;
  let stopped = false;
  // IP-16: stops the periodic terminal-run prune sweep on shutdown.
  let stopRunPruning: (() => void) | undefined;
  // W-028: stops the periodic WS replay-buffer TTL sweep on shutdown.
  let stopReplayBufferPruning: (() => void) | undefined;
  // W-010: stops the unified retention sweep (spans, consolidator runs,
  // DLQ, idempotency + the opt-in content surfaces) on shutdown.
  let stopRetention: (() => void) | undefined;
  let auditDb: AuditDb | undefined;
  // W-051: tools/MCP audit-bus -> audit-chain bridge (process-global
  // subscription; must unsubscribe on stop()).
  let toolAuditBridge: ToolAuditBridge | undefined;
  let preBind: Awaited<ReturnType<typeof runPreBind>> | undefined;
  let verifier: TokenVerifier | undefined;
  let pepperHandle: import('@graphorin/security').SecretValue | undefined;

  let dispatcher = deps.ws.dispatcher;
  let tickets = deps.ws.tickets;
  let wsAdapter = deps.ws.wsAdapter;

  return {
    get listeningOn() {
      return listening;
    },
    get wsDispatcher() {
      return dispatcher;
    },
    get wsTickets() {
      return tickets;
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
          // IP-21: now that the audit chain is open, route the WS dispatcher's
          // commentary-sanitizer decisions into it.
          commentaryAuditSink?.bind(bridgeCommentaryToAudit(auditDb));
          // W-051: subscribe the audit chain to the tools/MCP audit bus
          // (shadow-mode dataflow findings, approvals, collisions, ...).
          toolAuditBridge = bridgeToolAuditToAudit(auditDb, {
            policy: config.audit.toolEvents,
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
          ...(workflowTimerDaemon !== undefined ? { workflowTimerDaemon } : {}),
          ...(channelsDaemon !== undefined ? { channelsDaemon } : {}),
        });

        // Start the consolidator first so it is ready to handle fired
        // triggers, bridge its cron / idle triggers onto the scheduler
        // (MCON-4 - without this nothing pipes triggers into the
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
        // W-032: fire due durable timers from server start onward.
        if (workflowTimerDaemon !== undefined) {
          await workflowTimerDaemon.start();
        } else if (workflows.size() > 0) {
          // A3 (item 16 tail): a registered workflow whose thread
          // suspends on sleepFor/sleepUntil never wakes without a
          // driver - the quietest deployment gap an always-on
          // assistant can ship. Domain composition is programmatic by
          // design (the config file carries no adapters), so surface
          // the omission loudly instead of sleeping forever.
          process.stderr.write(
            `[graphorin/server] ${workflows.size()} workflow(s) are registered but no ` +
              'durable-timer driver is wired - suspended threads with due timers ' +
              '(sleepFor/sleepUntil) will never wake on their own. Pass ' +
              'createServer({ workflowTimers: { driver } }) with createTimerDriver(...) ' +
              'from @graphorin/workflow.\n',
          );
        }

        // B1.6: the gateway starts LAST - inbound traffic only begins
        // once every downstream daemon (consolidator, scheduler,
        // timers) is live, so the first channel message never races
        // half-wired composition.
        if (channelsDaemon !== undefined) {
          await channelsDaemon.start();
        }

        // Sample a couple of gauges immediately so the very first
        // `/v1/metrics` scrape after start carries non-zero data.
        try {
          // S-09: readWalSize is negative when the DB is not in WAL mode.
          const wal = Math.max(0, readWalSize(store.connection));
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

        // IP-16: terminal run records (each holding an AbortController) would
        // otherwise accumulate forever; sweep them on a periodic timer.
        stopRunPruning = scheduleRunPruning(runs, now);

        // W-028: finished-run replay subjects (fresh runId per run, no
        // further push/replay activity) would otherwise hold up to
        // maxEvents payloads forever; sweep the buffer's TTL
        // periodically. Guarded: the dispatcher is absent on no-WS
        // configurations.
        if (dispatcher !== undefined) {
          stopReplayBufferPruning = scheduleReplayBufferPruning(dispatcher.replayBuffer, {
            intervalMs: config.server.stream.replayBuffer.pruneIntervalSeconds * 1000,
          });
        }

        // W-010 / W-008: the unified retention sweep over every SQLite
        // growth surface, including the W-061 idempotency sweep it
        // subsumes. Runs after runPreBind, so migrations have applied;
        // the first sweep fires immediately.
        const retentionLog = createConsoleRetentionLog(config.observability.logger);
        stopRetention = scheduleRetentionSweeps({
          store,
          config: config.retention,
          now,
          ...(retentionLog !== undefined ? { log: retentionLog } : {}),
        });

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
      // IP-16: halt the prune sweep before draining.
      stopRunPruning?.();
      stopRunPruning = undefined;
      // W-028: halt the replay-buffer TTL sweep symmetrically.
      stopReplayBufferPruning?.();
      stopReplayBufferPruning = undefined;
      // W-010: halt the retention sweep symmetrically.
      stopRetention?.();
      stopRetention = undefined;
      // W-051: unsubscribe from the tools audit bus and let in-flight
      // audit writes settle before the audit DB closes below.
      if (toolAuditBridge !== undefined) {
        toolAuditBridge.stop();
        try {
          await toolAuditBridge.drain();
        } catch {
          // Write errors were already surfaced by the bridge itself.
        }
        toolAuditBridge = undefined;
      }
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

      // B1.6: the gateway stops FIRST - the front door closes before
      // the daemons behind it, so shutdown drains only work that is
      // already in flight.
      if (channelsDaemon !== undefined) {
        try {
          await channelsDaemon.stop();
        } catch (err) {
          await emitError(options.hooks, { error: err, phase: 'beforeShutdown' });
        }
      }
      if (workflowTimerDaemon !== undefined) {
        try {
          await workflowTimerDaemon.stop();
        } catch (err) {
          await emitError(options.hooks, { error: err, phase: 'beforeShutdown' });
        }
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
      // E-21 (S-24/16): only close a store this server created -
      // caller-injected stores stay open for reuse across restarts.
      if (ownsStore) {
        await store.close();
      }
      listening = undefined;
      verifier = undefined;
      started = false;
      preBind = undefined;
      dispatcher = undefined;
      tickets = undefined;
      wsAdapter = undefined;
    },
  };
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
