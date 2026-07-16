---
"@graphorin/memory": patch
"@graphorin/client": patch
"@graphorin/agent": patch
---

fix(memory) + docs: gate compaction default on a window; fix reconnect/protocol-guard/channels docs

- MEMORY-C-03 / R-03 / EXAMPLES-02: a bare `createMemory()` used to auto-enable
  compaction from the default trust policy even with no `providerContextWindow`,
  leaving a dead-Infinity trigger and warning on every construction. The
  trust-based default now only enables compaction when a window is present, so
  the bare case is off and silent (functionally a no-op: compaction could never
  fire without a window). An explicit `compaction` config without a window still
  throws (CE-12). Removes the now-dead one-time WARN and its test-only reset.
- ORPHAN-SU-02: the reconnect backoff docstring matches the implementation
  (`baseMs * 2^(attempt-1)`, exponent clamped at 30, `attempt` 1-indexed).
- LATERAL-L-03: the `ProtocolGuardConfig` docstring no longer claims a
  non-existent `Agent.protocolGuard` knob; it is passed to `guardOutboundContent`
  / `resolvePolicy` when wiring server boundaries.
- SCAFFOLD-D1: the channels guide clarifies that only the `<<<commentary>>>`
  envelope is stripped outbound; `<<<untrusted_content ...>>>` markers are an
  inbound-only wrapper and are not removed on echo.
