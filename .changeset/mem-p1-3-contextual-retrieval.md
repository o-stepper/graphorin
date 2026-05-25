---
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

P1-3 — contextual retrieval (opt-in) + late-chunking default (see
`memory-improvement-proposals.md` §5, summary-table row **P1-3 · Contextual
retrieval (opt-in) + late-chunking default**). Facts and episodes were embedded
+ FTS-indexed as bare text, so a terse memory like "moved there in March" lost
the entities / timeframe that make it findable and silently dropped recall. The
write path now prepends a short **situating context** (Anthropic's Contextual
Retrieval) to the text that is embedded *and* lexically indexed, while the
canonical `text` shown to the user / audit trail is preserved. All changes are
additive ⇒ `patch` (pre-1.0).

- New `'late-chunk'` write-path default (offline, **no extra LLM call**): the
  deterministic `contextualize(...)` prepends a situating prefix derived from the
  fact's *own structured signals* (subject/predicate/object entities, an
  author-set `validFrom` timeframe, tags). A memory with no structured signals
  yields an empty context, so plain `remember({ text })` writes are left
  byte-identical. `'off'` indexes the bare text. (`@graphorin/memory`)
- `SemanticMemory` embeds and FTS-indexes the contextual text but stores the
  canonical `text`; configured via `createMemory({ contextualRetrieval:
  'off' | 'late-chunk' })` and a per-call `FactRememberOptions.indexText`
  override. (`@graphorin/memory`)
- `SqliteMemoryWriteOptions` / `EmbeddedWriteOptions` gain an optional
  `indexText`; `rememberWithEmbedding` indexes `facts_fts` against it while the
  `facts.text` column stays canonical (no schema change — the index text is
  ephemeral). (`@graphorin/store-sqlite`, `@graphorin/memory`)
- New **opt-in, consolidator-only** `'llm'` mode: the standard phase spends one
  budgeted cheap-model call per additive write to author a 1–2 sentence
  situating prefix, then passes it as the write's index text. It degrades to the
  deterministic late-chunk prefix on an empty completion or a provider error
  (so it can never wedge a write), and it is the **only** contextualization that
  touches a provider — the hot write path has none, keeping `'llm'` strictly
  background. Configured via `createMemory({ consolidator: { contextualRetrieval:
  'off' | 'late-chunk' | 'llm' } })`; new `ContextualRetrievalMode` type on
  `ConsolidatorConfig` / `CreateConsolidatorOptions`, per-tier default
  `'late-chunk'`. (`@graphorin/memory`)

The `'llm'` enrichment is confined to the `add` path of the standard phase;
updates / conflicts (which supersede via the shared `SemanticMemory`) ride the
offline late-chunk prefix. Late-chunking is the deterministic, generic-embedder
approximation of Jina late chunking (token-level pooling is not exposed by the
`EmbedderProvider` contract); per-embedder vector re-indexing of historical
facts under `'llm'` is intentionally deferred.
