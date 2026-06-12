---
'@graphorin/core': patch
'@graphorin/memory': patch
'@graphorin/store-sqlite': patch
---

feat(memory): promotion lifecycle for quarantined episodes, insights, and procedures (MCON-2, part 1)

Everything the consolidator writes lands quarantined — extraction facts,
auto-formed episodes, reflection insights, induced procedures — but promotion
existed **only** for facts (`SemanticMemory.validate` + `setStatus`). For
episodes / insights / procedures, quarantine was terminal at the API level:
paid extraction / reflection / induction tokens produced memory that could
never surface in default recall, and induced procedures (P2-2) never reached
`activate()` — the feature was dead without benefit.

- Adds `setStatus(id, status, reason?)` to the episodic / insight / procedural
  SQLite stores (a retrieval gate only — it writes a `memory_history` audit row
  and never touches content), surfaced via `EpisodicMemoryStoreExt` /
  `InsightMemoryStoreExt` / the new `ProceduralMemoryStoreExt`.
- Adds `validate(scope, id, reason?, { force? })` to `EpisodicMemory`,
  `InsightMemory`, and `ProceduralMemory`, mirroring `SemanticMemory.validate`:
  it re-derives the injection verdict from the stored text and **refuses**
  promotion of an injection-flagged memory (`QuarantinePromotionRefusedError`)
  unless an operator passes `{ force: true }` from a trusted, non-agent context.
  Induced procedures drive *actions*, so this gate matters most for them.
- Adds the `memory.write.insight` span type.

Real-sqlite e2e test: a quarantined episode / insight / procedure is promoted
into recall / `activate()`, and an injection-flagged procedure is refused
without `force` and promoted with it. The review CLI and opt-in auto-promotion
(MCON-2 parts 2–3) follow.
