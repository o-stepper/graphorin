---
'@graphorin/core': patch
---

docs(core): honest enforcement status for sandboxPolicy / memoryGuardTier (AG-18)

`Tool.sandboxPolicy` JSDoc now states its ADVISORY status in the default
agent build (inline `config.tools` closures run in-process; the resolved
policy is surfaced on the span/audit; real isolation applies to
module-loadable skill/MCP tools). `Tool.memoryGuardTier` JSDoc — and the
stale agent-runtime/tools guide rows that still said "inert" — now reflect
SDF-1 reality: the guard is ACTIVE when the agent has `memory` wired, and
skipped with a one-time WARN otherwise.
