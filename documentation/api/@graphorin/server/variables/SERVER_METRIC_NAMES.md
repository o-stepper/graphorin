[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SERVER\_METRIC\_NAMES

# Variable: SERVER\_METRIC\_NAMES

```ts
const SERVER_METRIC_NAMES: Readonly<{
  agentRunDuration: "graphorin_agent_run_duration_seconds";
  agentRunsTotal: "graphorin_agent_runs_total";
  buildInfo: "graphorin_build_info";
  consolidatorBudgetRemainingTokens: "graphorin_consolidator_budget_remaining_tokens";
  consolidatorBudgetRemainingUsd: "graphorin_consolidator_budget_remaining_usd";
  consolidatorDlqSize: "graphorin_consolidator_dlq_size";
  consolidatorQueueDepth: "graphorin_consolidator_queue_depth";
  idempotencyCacheHitRatio: "graphorin_idempotency_cache_hit_ratio";
  inflightRuns: "graphorin_inflight_runs";
  replayBufferEvents: "graphorin_replay_buffer_events";
  serverUptime: "graphorin_server_uptime_seconds";
  storageWalSize: "graphorin_storage_wal_size_bytes";
  triggersFiresTotal: "graphorin_triggers_fires_total";
}>;
```

Defined in: packages/server/src/metrics/catalog.ts:32

**`Stable`**
