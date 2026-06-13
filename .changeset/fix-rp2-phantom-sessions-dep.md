---
'@graphorin/agent': patch
---

fix(agent): drop the phantom @graphorin/sessions dependency; correct sessions↔agent docs (RP-2)

`@graphorin/agent` declared `@graphorin/sessions` as a dependency but never
imported it (only a prose mention in a doc-comment), and the sessions facade /
cassette recorder claimed the recorder was "wired into the agent runtime" and
that `appendHandoff` "auto-fires from `Agent.toTool()`" — neither is true: the
agent accumulates handoffs in its own `RunState` and emits `RunContext` events
that the **operator** forwards into the recorder / `appendHandoff` (the pattern
the `examples/multi-agent-crew` example already demonstrates).

The phantom dependency is removed from the agent manifest, and the misleading
doc-comments now state that the operator wires the events manually and point at
the canonical example. (The bridge itself is intentionally not auto-wired in
this release.)

Red-first: a guard test asserts `@graphorin/agent`'s package.json declares no
`@graphorin/sessions` dependency.
