---
'@graphorin/agent': minor
---

Activate deferred tool loading and the built-in `tool_search` in the agent
loop (WI-05 / P0-3). The per-step tool catalogue is now assembled from the
unified registry (WI-02) instead of `config.tools`, so the registry is the
single source of truth for both what the model *sees* and what the executor
can *run*:

- **Deferred tools are withheld from the catalogue.** A tool marked
  `defer_loading: true` is registered (and executor-resolvable) but is not sent
  to the provider each step, keeping large tool sets out of the context window.
- **`tool_search` is auto-registered iff ≥1 tool defers.** When a deferred pool
  exists, the built-in `createToolSearchTool({ registry })` is registered as an
  eager, `first-party-built-in` tool so the model can discover deferred tools on
  demand; it never appears when nothing defers (zero overhead). A user tool that
  already occupies the name `tool_search` is never clobbered.
- **Matches are promoted for the rest of the run.** When the model calls
  `tool_search`, every matched tool name is promoted into a per-run set and
  advertised (and thus callable) on subsequent steps. Promotion is in-memory per
  run.
- **Skill tools are now advertised.** Because the catalogue is the registry's
  eager list, skill tools (registered since WI-02, executable since WI-03) are
  now sent to the provider as well — previously they were registered but never
  advertised.
- **`prepareStep` tool overrides** build a step-scoped registry + executor as
  before; that pair now also drives the advertised catalogue (and gets its own
  `tool_search` when the overridden set defers), so the catalogue and the
  executor always agree.

`searchDeferred` ranks via the registry's three-tier chain (semantic when an
embedder is configured ⟶ BM25 ⟶ regex name-match) and emits the existing
`tool.retrieval.*` counters, so eager-vs-deferred and the firing stage stay
observable.

Note: the promotion set is not persisted across a suspend/resume — a run that
suspends for approval and resumes starts again from the eager catalogue until
`tool_search` is re-invoked. Persisting promotions in `RunState` is a separable
follow-up.
