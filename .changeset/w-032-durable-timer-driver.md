---
'@graphorin/core': minor
'@graphorin/workflow': minor
'@graphorin/store-sqlite': minor
'@graphorin/server': minor
---

Durable timers now fire without user polling code (W-032). The engine stamps `CheckpointMetadata.wakeAt` (earliest due frontier timer) on suspended checkpoints; `CheckpointStore` gains the optional `listSuspended(namespace, { dueBefore, limit })` enumeration (implemented by the SQLite adapter - migration 032 adds `workflow_checkpoints.wake_at` with a partial index - and by `InMemoryCheckpointStore`); the new `createTimerDriver({ workflows: [{ workflow, checkpointStore }] })` polls due threads and calls `workflow.tick`, re-arming at `min(pollIntervalMs, earliest nextWakeAt)`, with per-thread error isolation and benign handling of cross-process `checkpoint-version-conflict` races. On the server, `createServer({ workflowTimers: { driver } })` binds a lifecycle daemon and reports `checks.workflowTimers` on `/v1/health`. A custom store without `listSuspended` fails fast with `TimerDriverStoreUnsupportedError`. Threads suspended before migration 032 carry no `wake_at` and stay invisible to the driver until one manual `tick` or resume re-persists them.
