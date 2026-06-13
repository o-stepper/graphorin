---
'@graphorin/server': minor
---

Make the Prometheus catalog honest — wire the run + idempotency metrics, drop the sourceless ones (IP-15).

Half the registered `graphorin_*` catalog produced permanently-empty series: 8
metrics were declared but never moved by any `inc()`/`set()`/`observe()` call,
so dashboards built against them showed flat lines forever.

Wired live:

- `graphorin_agent_runs_total{status}` and `graphorin_agent_run_duration_seconds`
  now move on every run completion. `RunStateTracker` gained an optional
  `onTerminal` constructor callback (with exported `TerminalRunInfo` /
  `TerminalRunStatus` types) that fires exactly once per run on its first
  terminal transition; the server turns it into the counter + duration summary.
- `graphorin_idempotency_cache_hit_ratio` is published by the idempotency
  middleware (replays / replays+executes) when a `metricRegistry` is supplied
  (new `IdempotencyMiddlewareOptions.metricRegistry`).

Removed (no producer exists anywhere in the monorepo — per-tool and provider
usage live in the agent runtime, redaction in the observability layer, OAuth
freshness needs an MCP token store the server does not own):
`graphorin_tool_calls_total`, `graphorin_provider_tokens_total`,
`graphorin_provider_cost_usd_total`, `graphorin_redaction_drops_total`,
`graphorin_oauth_tokens_freshness_seconds`. Their keys are gone from
`SERVER_METRIC_NAMES`. An absent series is more honest than a permanently-empty
one; they can return when a real producer is wired.
