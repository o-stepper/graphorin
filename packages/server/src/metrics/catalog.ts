/**
 * Canonical metric inventory for the standalone server. Every metric
 * the framework emits is registered here in one place so the
 * exposition output is deterministic across builds.
 *
 * Metric naming follows the documented `graphorin_*` prefix
 * discipline; label cardinality is bounded by construction (no PII
 * labels — see DEC-141 cross-cut).
 *
 * @packageDocumentation
 */

import { MetricRegistry } from './registry.js';

/**
 * @stable
 */
export const SERVER_METRIC_NAMES = Object.freeze({
  agentRunsTotal: 'graphorin_agent_runs_total',
  agentRunDuration: 'graphorin_agent_run_duration_seconds',
  toolCallsTotal: 'graphorin_tool_calls_total',
  providerTokensTotal: 'graphorin_provider_tokens_total',
  providerCostUsdTotal: 'graphorin_provider_cost_usd_total',
  storageWalSize: 'graphorin_storage_wal_size_bytes',
  idempotencyCacheHitRatio: 'graphorin_idempotency_cache_hit_ratio',
  triggersFiresTotal: 'graphorin_triggers_fires_total',
  redactionDropsTotal: 'graphorin_redaction_drops_total',
  consolidatorQueueDepth: 'graphorin_consolidator_queue_depth',
  consolidatorDlqSize: 'graphorin_consolidator_dlq_size',
  consolidatorBudgetRemainingUsd: 'graphorin_consolidator_budget_remaining_usd',
  consolidatorBudgetRemainingTokens: 'graphorin_consolidator_budget_remaining_tokens',
  oauthTokensFreshness: 'graphorin_oauth_tokens_freshness_seconds',
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
  registry.registerCounter(
    SERVER_METRIC_NAMES.toolCallsTotal,
    'Total tool invocations by tool id and terminal status.',
    ['tool', 'status'],
  );
  registry.registerCounter(
    SERVER_METRIC_NAMES.providerTokensTotal,
    'Total provider tokens by direction (input/output).',
    ['provider', 'model', 'direction'],
  );
  registry.registerCounter(
    SERVER_METRIC_NAMES.providerCostUsdTotal,
    'Total provider cost in USD.',
    ['provider', 'model'],
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
  registry.registerCounter(
    SERVER_METRIC_NAMES.redactionDropsTotal,
    'Total redaction drops by reason and pattern bucket.',
    ['reason', 'pattern'],
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
    SERVER_METRIC_NAMES.oauthTokensFreshness,
    'Seconds since the most recent OAuth refresh per server.',
    ['server_id'],
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
