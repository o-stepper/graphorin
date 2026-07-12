---
'@graphorin/core': minor
'@graphorin/agent': minor
'@graphorin/memory': minor
'@graphorin/sessions': minor
'@graphorin/store-sqlite': minor
---

Memory writes strictly after guardrails (bot-adoption wave B, B3 / item 15). The run loop's commit gates stamp a per-turn verdict sidecar - `RunState.verdicts`, a plain JSON-safe object keyed `'<step>:<offset>'` with `RunTurnVerdict { guardrail?, lateralLeak?, dataflowFlags? }` - covering input-guardrail block/rewrite, lateral-leak blocks and assistant-output dataflow findings; widen-only merge, serialized through `SerializedRunState` with a defensive rebuild, wiped by compaction for the turns its splice summarized away, and surfaced directly as `AgentResult.verdicts`. Verdicts persist next to the message: `SessionMessagePushOptions.verdict` threads through core `SessionMemoryStore.push` (additive third argument), the memory session tier, `Session.push` and the sqlite store (`verdict_json` column, migration 035; malformed rows degrade to no verdict), and `SessionMessageRecord.verdict` exposes it on the consolidator read path. `createMemory({ ingestGate })` then filters the extraction batch deterministically on BOTH consolidator paths before noise filtering - the canonical `verdictIngestGate` excludes blocked and lateral-leak-withheld turns while rewritten turns pass with their rewritten text; the idempotency cursor still advances through excluded messages (a blocked turn can never wedge consolidation) and a throwing gate fails closed. This gate is the required precondition for the auto-promotion and proactive act-grant features of later waves.
