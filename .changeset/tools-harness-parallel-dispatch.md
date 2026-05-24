---
'@graphorin/agent': patch
---

Verify and lock the parallel tool-dispatch contract (WI-04 / P0-2). The
concurrency itself was enabled in WI-03 — `createAgent(...)` already forwards
`maxParallelTools` to the `ToolExecutor` and routes each step's non-handoff
calls through `executeBatch(...)`, which runs independent calls concurrently.
This change pins that behaviour with tests and documents the contract at the
dispatch site:

- **Independent calls in one step run concurrently**, bounded by
  `maxParallelTools` (default 8). `maxParallelTools: 1` serialises them.
- **`executionMode: 'sequential'` tools never overlap** — the executor
  partitions them out and runs them one at a time.
- **Result ordering is deterministic.** `tool.execute.start` is emitted
  up-front in call order and `.end` / `.error` after the batch settles, also in
  call order, so result mapping and tool-message history do not depend on which
  call finishes first. Live `.progress` / `.partial` events for concurrent
  calls interleave and are keyed by `toolCallId`.

No runtime behaviour changes here (the activation landed in WI-03); this is the
test + documentation half of the work item.
