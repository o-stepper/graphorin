---
'@graphorin/agent': minor
---

Wire the `@graphorin/tools` `ToolExecutor` into the agent run loop (WI-03 /
P0-1, the keystone). `createAgent(...)` now constructs one `ToolExecutor` at
warm-up (bound to the unified registry from WI-02) and routes every
non-handoff tool call through `executor.executeBatch(...)`, giving
`createToolExecutor(...)` its first production call-site.

This **activates the documented tool fields the inline loop silently
bypassed**:

- **`secretsAllowed`** — per-tool secret ACL is now enforced; a tool that
  `require(...)`s a key outside its allowlist is denied (the old loop wired a
  rejecting stub for all secrets).
- **`maxResultTokens` / `truncationStrategy`** — large results are truncated
  (with optional spill) before entering history.
- **`inboundSanitization`** — untrusted output is flagged / stripped / wrapped
  per the tool's policy.
- **`memoryGuardTier`** (factory wired), **`idempotencyKey`**, and
  **single-round tool repair** — now reachable on the live execution path.

Independent tool calls in one step are dispatched concurrently (bounded by
`maxParallelTools`, default 8); `tool.execute.*` events for concurrent calls
may interleave (keyed by `toolCallId`), and `CompletedToolCall` ordering stays
stable.

**Preserved behaviour (R10):** the happy-path `AgentEvent` stream is unchanged
(a golden-trace parity test pins the exact sequence). The agent owns the
`tool.execute.start` / `.end` / `.error` lifecycle (derived from the executor's
returned outcomes) so every outcome kind yields a consistent event + tool
message; the executor's genuinely-live `tool.execute.progress` / `.partial`
events are bridged through while a batch runs and are purely additive. Handoffs
remain special-cased inline (≤1/step) and are never routed through the
executor. Durable HITL is preserved: approval is pre-screened in the agent and
suspends the run exactly as before (persist `RunState`, resume via directive);
the executor's `ApprovalGate` auto-grants because only no-approval /
pre-approved calls ever reach it.

Fidelity notes (verified against source):

- **Sandbox is intentionally not wired.** `config.tools` are inline
  `tool({...})` closures that cannot be serialised to an out-of-process
  sandbox, and `resolveSandbox` defaults user-defined tools to
  `worker-threads`; a resolver returning a real sandbox for that kind would
  break every inline tool. The executor therefore runs inline (its documented
  fallback) while the resolved policy is still surfaced on the tool-execute
  span / audit. Real isolation applies to module-loadable (skill / MCP) tools
  and is wired when those land.
- **Approved tools are not re-executed on resume.** The existing resume path
  (apply the approval decision, continue) is unchanged; actually executing an
  approved call on resume is a separable follow-up.
- The executor's audit sink defaults to the global tool-audit bus; forwarding
  it onto the agent tracer is deferred.
