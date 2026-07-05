[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / fanout

# fanout

Agent-step-level fan-out - `Agent.fanOut(...)` convenience that
spawns N sub-agents in parallel under a bounded-fanout cap with
per-child budgets and four built-in merge strategies.

Boundary discipline against the workflow `Dispatch(...)`
primitive: fan-out is **agent-step-level inline result** (children
share parent `RunContext` lineage; result consumed by parent's
continuing loop within one or few `agent.run(...)` calls).
`Dispatch(...)` is workflow-step-level checkpointed durable graph.
The two compose orthogonally.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ChildResult](/api/@graphorin/agent/fanout/interfaces/ChildResult.md) | Per-child outcome surfaced on [FanOutResult.children](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md#property-children). Failed-child isolation: a child that throws produces a `ChildResult` with `status: 'failed'` - never an exception thrown from the fan-out call itself. |
| [FanOutOptions](/api/@graphorin/agent/fanout/interfaces/FanOutOptions.md) | Per-call options accepted by `Agent.fanOut(...)`. |
| [FanOutResult](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md) | Aggregate result returned by `Agent.fanOut(...)`. |
| [PerChildBudget](/api/@graphorin/agent/fanout/interfaces/PerChildBudget.md) | Per-child budget. Defaults derived from the canonical 2026 scaling-rule table for agent fan-out workloads. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [MergeStrategy](/api/@graphorin/agent/fanout/type-aliases/MergeStrategy.md) | Built-in merge-strategy taxonomy. |

## Functions

| Function | Description |
| ------ | ------ |
| [runFanOut](/api/@graphorin/agent/fanout/functions/runFanOut.md) | Run a fan-out and produce the aggregate [FanOutResult](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md). Pure with respect to side effects - the runtime emits events / audit rows / counter increments via the supplied `emit` callback. |
