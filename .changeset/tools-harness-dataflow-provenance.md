---
'@graphorin/core': minor
'@graphorin/security': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

WI-12 / P1-3 — provenance / taint-based prompt-injection defense (toward CaMeL, opt-in).

**Enforce data flow, not just patterns.** A new agent config `dataFlowPolicy`
defuses the *lethal trifecta* — untrusted content + private data + an
exfiltration/mutation sink — using the provenance Graphorin already tracks
(trust class + source + sensitivity) rather than pattern scans alone. The
executor gates every **sink** (`side-effecting` / `external-stateful` tool)
before it runs and records the provenance of every output for later checks. A
sink trips the policy on a verbatim **`untrusted-to-sink`** flow (untrusted
content forwarded into the sink's arguments) or — conservatively — the
**`lethal-trifecta`** signal (the sink fires while both untrusted *and*
secret-tier data are present in the run).

**Policy engine (`@graphorin/security`).** New `@graphorin/security/dataflow`:
`deriveTaintLabel(...)` (provenance from `__trustClass` + `__source` +
`sensitivity`; untrusted = `mcp-derived` / `web-search` / `skill-untrusted`,
sensitive = `'secret'`), `createTaintLedger(...)` (run-scoped state: coarse
untrusted/sensitive flags + bounded best-effort verbatim-span detection), and
`createDataFlowPolicy(...)` (pure decision: `off` / `shadow` / `enforce`,
`guardTrifecta`, `declassifySinks`). Fully I/O-free.

**Enforcement point (`@graphorin/tools`).** New optional
`ExecutorOptions.dataFlowGuard` (`DataFlowGuard` = `inspect` sink gate +
`record`); a `'block'` verdict short-circuits to a new
`ToolErrorKind: 'dataflow_policy_blocked'` (`@graphorin/core`). New audit
actions `tool:dataflow:flagged | blocked | declassified` + a
`tool.dataflow.decision.total` counter. Read-only / pure tools are never gated
(zero overhead on the common path); the guard is absent unless configured.

**Agent wiring (`@graphorin/agent`).** New `AgentConfig.dataFlowPolicy?:
DataFlowPolicyConfig`. The guard is built once and shared by every executor —
**including the code-mode quiet executor**, so an injection cannot exfiltrate
through a sandbox either (composes with WI-11). Modes: `'shadow'` audits a
tripped flow but never blocks (ship first to surface false positives);
`'enforce'` blocks the sink unless its name is in `declassifySinks` (an
audited operator override). Taint is tracked in-memory per run (not persisted
across suspend/resume; the ledger map is bounded). Verbatim detection is
best-effort (catches verbatim/near-verbatim forwarding, not paraphrase — that
is the trifecta gate's job).

The default path (no `dataFlowPolicy`) is byte-for-byte unchanged (R10). Fully
offline (R4).
