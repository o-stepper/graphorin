---
'@graphorin/memory': patch
---

chore(memory): delete the dead per-step tool-budget allocator + its config knobs (CE-11)

The RB-44 tool-catalogue allocator (`allocateToolCatalogue` / `updateLazyLoadedSet`
and the `tool-budget/` module) and the `maxToolsInContext` / `toolSearchThreshold`
context-engine knobs were inert in production: `assemble()` never read them, they
only echoed into `config()`, and the symbols were referenced solely by index
re-exports and their own tests. The agent's real per-step catalogue is the
`@graphorin/tools` defer-loading / `tool_search` promotion path, which has no
cardinality cap.

Resolving CE-11 within CE-1 (the engine-wiring pass), this takes **Variant B**:
delete the module and both knobs rather than wire a second, parallel deferral
design — wiring it would also conflict with the append-only / prompt-cache-stable
catalogue direction. `ResolvedContextEngineConfig` no longer advertises the two
dead fields. No behavioural change: nothing consumed them.
