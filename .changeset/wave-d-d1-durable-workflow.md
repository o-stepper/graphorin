---
'@graphorin/core': minor
'@graphorin/workflow': minor
'@graphorin/store-sqlite': minor
---

Durable workflow orchestration (audit 2026-07-04 Wave D, cluster D1) - promotes the workflow engine to step-checkpoint durable execution and closes the confirmed `workflow-01..14` correctness floor.

- Feature floor: atomic checkpoint compare-and-set (`CheckpointStore.put({ expectedLatestId })` + `CheckpointConflictError`, honoured by both bundled stores), planned-order channel writes, merge-failure + boundary-abort + max-steps terminal checkpointing, all-false-`__start__` dead-end, ephemeral-value observability on `workflow.channel.update`, satisfied-pause retention on sibling failure, `maxConcurrentTasks` bounded task pool, `Dispatch` cross-realm brand, and hygiene (dead `visitedNodes`, six->seven stream modes, `'async'` source removed, resume durability override).
- New durable capabilities: per-node `timeoutMs` + `retry` (`nodeDefaults`), durable timers (`sleepUntil`/`sleepFor` + `workflow.tick`), durable promises (`awaitExternal` + `resolveAwakeable`), persisted approvals (`requestApproval` + `approve`), `WorkflowConfig.version` pinning (`workflow-version-mismatch`) + journal-divergence detection, and opt-in step journaling (`journalSteps`) with crash-recovery that replays completed tasks and re-runs only unfinished work.
