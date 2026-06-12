---
'@graphorin/embedder-ollama': patch
'@graphorin/store-sqlite': patch
---

fix(embedder-ollama): fail loudly on unknown embedding dim instead of 0 (PS-11)

`OllamaEmbedder.dim()` returned `KNOWN_OLLAMA_MODEL_DIMS.get(model) ?? 0` for an
unknown model, and `id()` baked `@0`. Because `createMemory` binds the embedder
at construction (before the first `embed()` resolves the real width), the store
registered `dim = 0`, created a `float[0]` vec0 table, and silently broke vector
search — permanently, since the `@0` id locked in.

- `dim()` (and `id()`, which now derives from it) throws a clear, actionable
  `OllamaEmbedderError` when the width is unknown and no `dim` was supplied; the
  `dim` option's docs say it's required for models outside the known map. The
  map gains the current single-width families (`embeddinggemma`, `all-minilm`,
  `granite-embedding`, `bge-large`, `snowflake-arctic-embed2`,
  `paraphrase-multilingual`); size-variant families are deliberately left out so
  an ambiguous bind fails rather than baking a wrong width.
- `EmbeddingMetaRepository.registerOrReturn` rejects a non-positive / non-integer
  `dim` up front, so the bad width can never reach a vec0 table.

Red-first: an unknown-model embedder throws on `dim()`/`id()` (but works with an
explicit `dim` or after a first embed resolves the width), the new families are
present, and the store rejects `dim: 0`. The existing test that pinned the old
`dim() === 0` pre-embed behaviour is updated to expect the throw.
