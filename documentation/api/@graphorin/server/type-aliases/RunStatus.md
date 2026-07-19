[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStatus

# Type Alias: RunStatus

```ts
type RunStatus = 
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "aborted";
```

Defined in: packages/server/src/runtime/run-state.ts:32

**`Stable`**

Stable status discriminator for a run snapshot. Mirrors the values
exposed on the public REST surface. `'awaiting_approval'`: the run
suspended on durable HITL and its resumable
`RunState` is retained by the tracker until
`POST /runs/:runId/resume` (or an abort) settles it.
