---
"@graphorin/client": patch
"@graphorin/agent": patch
---

docs: reconcile the last P3 doc drift from the 2026-07 e2e campaign

- ORPHAN-SU-02: the reconnect backoff docstring matches the implementation
  (`baseMs * 2^(attempt-1)`, exponent clamped at 30, `attempt` 1-indexed).
- LATERAL-L-03: the `ProtocolGuardConfig` docstring no longer claims a
  non-existent `Agent.protocolGuard` knob; it is passed to `guardOutboundContent`
  / `resolvePolicy` when wiring server boundaries.
- SCAFFOLD-D1: the channels guide clarifies that only the `<<<commentary>>>`
  envelope is stripped outbound; `<<<untrusted_content ...>>>` markers are an
  inbound-only wrapper and are not removed on echo.
- Guide pages catch up with the MEMORY-C-03 behavior that shipped in 0.10.1:
  a bare `createMemory()` documents compaction as off-and-silent until a
  `providerContextWindow` is supplied (memory-system table + agent-runtime
  context-management section), and the channels guide shows the real
  untrusted-content envelope attributes (`trust=` / `tool=` / `origin=`).
