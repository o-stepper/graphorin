---
'@graphorin/agent': patch
'@graphorin/memory': patch
---

fix(agent): delete the inert `AgentConfig.contextEngine` field (AG-4)

`AgentConfig.contextEngine` was declared but never read anywhere in the
runtime — the context engine is, and remains, configured on the memory facade
(`createMemory({ contextEngine })`); the agent reaches it through
`memory.contextEngine` (compaction always; `assemble()` behind the
`autoAssembleContext` opt-in from CE-1). A config knob that typechecks but does
nothing is a trap, so it is removed rather than duplicated. The README's
"inbound sanitization preamble" bullet now states the real condition (the
preamble is part of `assemble()`, so it runs only under `autoAssembleContext`
with memory wired), and the facade comment notes the same.
