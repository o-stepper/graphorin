---
'@graphorin/agent': patch
---

feat(agent): merge guard + fanout events + per-child budgets are real (AG-7 / AG-16)

The fan-out defense layer existed only as pure helpers: `config.mergeGuard` /
`config.protocolGuard` were never read, `MergeBlockedError` was unreachable,
`agent.fanOut` never passed an `emit` so `agent.fanout.spawned/merged` never
reached the stream, and `PerChildBudget.tokens/toolCalls` silently never
enforced (every child reported `tokensUsed: 0`).

- **Merge guard wired (AG-7):** on `'judge-merge'`, each child's source trust
  (`computeSourceTrust`: trust-class × origin × history, with operator
  overrides) and contribution weight (token overlap of the child's output vs
  the judge's merged output) feed `evaluateMerge`. A biased merge emits
  `agent.lateral-leak.detected` (vector `sideways-injection`, causality chain =
  offending child) and `strictness: 'detect-and-block'` throws
  `MergeBlockedError`. Children accept optional `trustClass` / `origin` /
  `historyAdjustment` descriptors (defaults `loopback`/`built-in`).
- **Fanout events reach `agent.stream()` (AG-7):** `agent.fanOut` now passes an
  `emit` that queues `agent.fanout.spawned/merged` (and leak detections) onto
  the external-event queue, drained into the active/next stream.
- **`AgentConfig.protocolGuard` deleted (AG-7):** the agent has no protocol
  boundary; `guardOutboundContent` remains an exported helper for the server
  SSE/session boundary (wired in the server thread). Docs updated.
- **Per-child budgets enforce (AG-16):** a child `invoke` resolving to a full
  `AgentResult` (e.g. `() => child.run(input)`) is detected structurally;
  `output` is unwrapped and `tokensUsed` / `toolCallCount` harvested from
  `usage`/`state.steps`. `tokens`/`toolCalls` caps now enforce post-hoc —
  an over-budget child becomes `status: 'budget-exceeded'` with its output
  withheld from the merge. Plain-value children keep duration-only
  enforcement (documented).
- **Timer leak fixed (AG-16):** the duration race timer is cleared in
  `finally` — a rejecting child no longer leaves it armed. Dead WARN block
  removed.
