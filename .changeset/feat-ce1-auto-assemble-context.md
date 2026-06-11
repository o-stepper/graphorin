---
'@graphorin/agent': patch
---

feat(agent): opt-in `autoAssembleContext` — build the system prompt from the memory context engine (CE-1, part 1)

`ContextEngine.assemble()` (the six-layer memory-aware system prompt) had **no
production call site** — the agent built its prompt from `instructions` alone and
the model reached memory only through the memory tools it called. That explicit
pattern stays the default; this adds an **opt-in** to wire `assemble()` into the
run loop.

`createAgent({ memory, autoAssembleContext: true })` (default `false`) builds the
per-run system prompt via `memory.contextEngine.assemble(...)` once at run start:
`instructions` become Layer 2, and the engine prepends the memory base and
appends working blocks, procedural rules, skill cards, the metadata counts, and
— when `factsAutoRecall` is configured — auto-recalled facts. Off by default it
is byte-identical to today's behaviour and has no effect without `memory`, so
the documented quickstart pattern is unchanged.

Tests assert the system prompt is the assembled output when the flag is on, and
plain `instructions` (with `assemble` never called) when it is off.
