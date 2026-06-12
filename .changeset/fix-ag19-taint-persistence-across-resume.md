---
'@graphorin/core': patch
'@graphorin/security': patch
'@graphorin/agent': patch
---

fix(agent): persist the coarse taint summary + promoted tools across suspend/resume (AG-19)

Run-scoped security/discovery state was lost on resume: the data-flow taint
ledger and `tool_search` promotions are in-memory only, so a resumed run (e.g. in
a fresh process) started with an empty ledger. An untrusted/secret exposure that
happened before the suspend no longer gated sinks — enforce-mode was silently
weakened on exactly the HITL boundary it should protect — and discovered tools
fell out of the catalogue.

- `@graphorin/security`: `TaintLedger` gains `snapshot()` and a `createTaintLedger({ initial })` seed — the **coarse trifecta-gate flags only** (`untrusted`/`sensitive`/source-kinds), never the tracked verbatim spans (those are untrusted text and must not be persisted).
- `@graphorin/core`: `RunState` gains `taintSummary?: RunTaintSummary` + `promotedTools?` (structurally matches `TaintLedgerSnapshot`; core takes no security dependency). `RUN_STATE_SCHEMA_VERSION` bumps `1.0 → 1.1` (additive; v1.0 payloads still read).
- `@graphorin/agent`: on suspend the runtime snapshots the ledger + promoted set into the `RunState`; on resume it seeds the ledger (before any tool runs) and restores the promoted set, so an enforce-mode sink stays gated across resume. The verbatim-carry probe resets (its spans are not persisted). The `agent-runtime` doc is corrected.

Test: a run resumed with a persisted `untrusted + sensitive` taint summary has its
sink blocked in enforce mode (`dataflow_policy_blocked`), where an empty ledger
would have let it through.

A dedicated stream event for data-flow blocks is deferred — the block is already
stream-visible as a typed `tool.execute.error` (`dataflow_policy_blocked`) plus a
`tool:dataflow:blocked` audit row.
