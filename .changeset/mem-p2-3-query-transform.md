---
'@graphorin/memory': patch
---

P2-3 — query transformation: multi-query / RAG-Fusion + opt-in HyDE (see
`memory-improvement-proposals.md` §5, summary-table row **P2-3 · Query
transformation (multi-query / HyDE)**). Auto-recall is a regex trigger and
search was single-shot, so a memory stored with different wording than the
user's phrasing was missed at retrieval. This fans a query into a few reworded
variants, retrieves each, and fuses the lists through the **existing** RRF
reranker; HyDE (arXiv:2212.10496) is offered as an opt-in for short / ambiguous
queries. All changes are additive ⇒ `patch` (pre-1.0).

- **New `@graphorin/memory/search` module** `query-transform.ts`: a
  provider-agnostic `QueryTransformer` seam (`expand` / `hypothetical`), a
  resilient provider-backed `createProviderQueryTransformer(provider, …)`, and
  pure, tolerant helpers (`parseQueryVariants`, `parseHypothetical`,
  `buildExpansionRequest`, `buildHydeRequest`). The module imports only
  `@graphorin/core` types and performs no I/O itself.
- **`SemanticMemory.search` gains `multiQuery?: number` and `hyde?: boolean`.**
  `multiQuery: N` fans the query into up to `N - 1` deduped variants (the
  original is always retained), retrieves FTS + vector per query string, and
  fuses **all** lists. `hyde: true` embeds a generated hypothetical answer and
  fuses its vector neighbours. The HyDE path skips the LLM call entirely when no
  embedder is configured (the passage could not be embedded). New span
  attributes `memory.search.semantic.query_count` / `.hyde_applied` (no query /
  variant text is logged — privacy parity with X-3).
- **Offline-by-default.** A query transformer is supplied only via the new
  opt-in `createMemory({ queryTransform: { provider, maxVariants?, maxTokens? }
  })`. With none configured — the default — `multiQuery` / `hyde` are **silent
  no-ops**: search stays single-shot and makes **no provider call**, so the hot
  path is unchanged. Variant generation is resilient (a provider error or
  unparseable output degrades to single-shot rather than throwing into recall).

Retrieval-heavy by design — reserve `multiQuery` / `hyde` for deliberate recall
rather than every search, as each adds a provider round-trip.
