---
'@graphorin/core': patch
'@graphorin/agent': patch
---

fix(agent): emit the documented terminal/progress events; delete the dead taxonomy (AG-20)

Several documented `@stable` events were never produced and one config knob was
never read:

- **`agent.end` is now emitted on every terminal path** — completed, failed,
  aborted, and suspended — carrying the final `AgentResult` (with the AG-9
  `status`/`error`/`state`). Stream consumers (e.g. an SSE bridge) finally get
  a uniform "stream over, here is the outcome" frame; a suspended run ends with
  `status: 'awaiting_approval'`.
- **`agent.progress.written` / `agent.progress.read` are now emitted** from the
  agent progress wrapper (queued and drained into the active/next stream).
  Out-of-run `progress.write` → `progress.read` pairs now share a stable
  fallback run id instead of fabricating a fresh id per call (which could never
  find what it just wrote).
- **`memory.read` / `memory.write` are deleted from the `AgentEvent` union** —
  zero emissions anywhere and no natural emit site (memory operations flow
  through tools, which already have their own lifecycle events).
- **`AgentConfig.modelTierAutoClassification` is deleted** — declared, never
  read.
- False docstrings corrected (`filters.full()` "deprecation warning",
  progress module "audit row"), the quickstart events table and the
  agent-runtime `agent.end` sample shape now match reality, and the
  hello-world golden-trace test actually asserts the `agent.end` its title
  always claimed.
