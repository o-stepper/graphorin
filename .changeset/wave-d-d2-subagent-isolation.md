---
'@graphorin/core': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

Sub-agent isolation & orchestration primitives (audit 2026-07-04 Wave D, cluster D2).

- Run-level `'read-only'` capability (single-writer constraint): `AgentConfig.capability` / `AgentCallOptions.capability` never advertise writer tools or handoffs and the executor deterministically blocks fabricated writer calls with the new `capability_blocked` `ToolErrorKind` (threaded through `executeBatch`/`executeOne`, HITL resume, and the code-mode bridge).
- `toTool({ contextFold })` returns a compact distilled child-run outcome instead of raw output; `toTool({ propagateTaint })` (default on) carries the child's coarse taint flags across the fold as a widen-only `ToolReturn.taint` override (`sourceKind: 'sub-agent'`) that re-arms the parent's data-flow ledger.
