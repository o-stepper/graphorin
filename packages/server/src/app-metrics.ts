/**
 * Live-metrics refresh for the `/v1/metrics` exposition - samples the
 * WAL size, uptime, in-flight runs, replay-buffer occupancy, trigger
 * fire counters, and consolidator gauges on every scrape. Wired into
 * the metrics route by `app-routes.ts`.
 *
 * @packageDocumentation
 */

import { type GraphorinSqliteStore, readWalSize } from '@graphorin/store-sqlite';
import type { ConsolidatorDaemon } from './consolidator/daemon.js';
import { SERVER_METRIC_NAMES } from './metrics/catalog.js';
import type { MetricRegistry } from './metrics/registry.js';
import { syncToolCounters } from './metrics/tools-bridge.js';
import type { RunStateTracker } from './runtime/run-state.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import type { WsDispatcher } from './ws/index.js';

export interface RefreshLiveMetricsOptions {
  readonly registry: MetricRegistry;
  readonly store: GraphorinSqliteStore;
  readonly runs: RunStateTracker;
  readonly startedAt: number;
  readonly now: () => number;
  readonly triggersDaemon?: TriggersDaemon;
  readonly consolidatorDaemon?: ConsolidatorDaemon;
  readonly wsDispatcher?: WsDispatcher;
}

export async function refreshLiveMetrics(options: RefreshLiveMetricsOptions): Promise<void> {
  const { registry, store, runs, startedAt, now } = options;

  // W-051: fold the tools/MCP module counters (dataflow shadow signals,
  // executor retries, reconnects, ...) into the scrape.
  syncToolCounters(registry);

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
    // W-028: the gauge now reports buffered EVENTS, matching its name -
    // previously it was filled with the subscription count. `stats` is
    // optional on the @stable ReplayBuffer interface, so external
    // implementations without it degrade to 0 instead of throwing.
    registry.set(
      SERVER_METRIC_NAMES.replayBufferEvents,
      options.wsDispatcher.replayBuffer.stats?.().events ?? 0,
    );
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
