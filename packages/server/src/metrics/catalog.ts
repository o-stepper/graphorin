/**
 * Canonical metric inventory for the standalone server. Every metric
 * the framework emits is registered here in one place so the
 * exposition output is deterministic across builds.
 *
 * Metric naming follows the documented `graphorin_*` prefix
 * discipline; label cardinality is bounded by construction (no PII
 * labels - see DEC-141 cross-cut).
 *
 * @packageDocumentation
 */

import { MetricRegistry } from './registry.js';

/**
 * @stable
 */
// IP-15: the catalog lists only metrics the server actually moves. Five
// previously-registered series - `graphorin_tool_calls_total`,
// `graphorin_provider_tokens_total`, `graphorin_provider_cost_usd_total`,
// `graphorin_redaction_drops_total` and `graphorin_oauth_tokens_freshness_seconds`
// - had no producer anywhere in the monorepo (per-tool and provider usage live
// in the agent runtime, not the server; redaction drops in the observability
// layer; OAuth freshness needs an MCP token store the server does not own). A
// permanently-empty series is worse than an absent one for dashboards, so they
// are dropped until a real producer exists rather than advertised inert.
// W-051 update: tool/MCP telemetry NOW has a producer - the scrape-time
// `metrics/tools-bridge.ts` sync lazily registers
// `graphorin_tool_*` / `graphorin_mcp_*` series from the tools package's
// live counter snapshot, so only series that actually moved ever appear
// (consistent with IP-15: nothing advertised inert).
export const SERVER_METRIC_NAMES = Object.freeze({
  agentRunsTotal: 'graphorin_agent_runs_total',
  agentRunDuration: 'graphorin_agent_run_duration_seconds',
  storageWalSize: 'graphorin_storage_wal_size_bytes',
  idempotencyCacheHitRatio: 'graphorin_idempotency_cache_hit_ratio',
  triggersFiresTotal: 'graphorin_triggers_fires_total',
  consolidatorQueueDepth: 'graphorin_consolidator_queue_depth',
  consolidatorDlqSize: 'graphorin_consolidator_dlq_size',
  consolidatorBudgetRemainingUsd: 'graphorin_consolidator_budget_remaining_usd',
  consolidatorBudgetRemainingTokens: 'graphorin_consolidator_budget_remaining_tokens',
  replayBufferEvents: 'graphorin_replay_buffer_events',
  inflightRuns: 'graphorin_inflight_runs',
  serverUptime: 'graphorin_server_uptime_seconds',
  buildInfo: 'graphorin_build_info',
} as const);

/**
 * Build a fully-registered {@link MetricRegistry} ready for the
 * `/v1/metrics` exposition. The returned registry has every metric
 * declared but no samples; the server runtime updates samples
 * incrementally.
 *
 * @stable
 */
export function createServerMetricRegistry(): MetricRegistry {
  const registry = new MetricRegistry();

  registry.registerCounter(
    SERVER_METRIC_NAMES.agentRunsTotal,
    'Total agent runs by terminal status.',
    ['status'],
  );
  registry.registerSummary(
    SERVER_METRIC_NAMES.agentRunDuration,
    'Agent run duration in seconds.',
    [],
  );
  registry.registerGauge(SERVER_METRIC_NAMES.storageWalSize, 'Current SQLite WAL size in bytes.');
  registry.registerGauge(
    SERVER_METRIC_NAMES.idempotencyCacheHitRatio,
    'Idempotency LRU cache hit ratio in [0, 1].',
  );
  registry.registerCounter(
    SERVER_METRIC_NAMES.triggersFiresTotal,
    'Total trigger fires by trigger id and outcome.',
    ['trigger_id', 'status'],
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.consolidatorQueueDepth,
    'Pending consolidator items by phase.',
    ['phase'],
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.consolidatorDlqSize,
    'Number of consolidator runs sitting in the dead-letter queue.',
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.consolidatorBudgetRemainingUsd,
    'Consolidator USD budget remaining for the current period.',
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.consolidatorBudgetRemainingTokens,
    'Consolidator token budget remaining for the current period.',
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.replayBufferEvents,
    'Number of events currently buffered for WebSocket replay.',
  );
  registry.registerGauge(
    SERVER_METRIC_NAMES.inflightRuns,
    'Number of in-flight agent / workflow runs.',
  );
  registry.registerGauge(SERVER_METRIC_NAMES.serverUptime, 'Server process uptime in seconds.');
  registry.registerGauge(
    SERVER_METRIC_NAMES.buildInfo,
    'Static `1` gauge carrying graphorin build labels.',
    ['version'],
  );

  return registry;
}
