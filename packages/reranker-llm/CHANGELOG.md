# @graphorin/reranker-llm

## 0.1.0

### Minor Changes

- Initial release of the LLM-as-reranker adapter for the Graphorin
  framework. Asks the configured `Provider` to score `(query, passage)`
  pairs against a deterministic scoring prompt and runs scoring in
  parallel batches via `Promise.all()`. Implements the `ReRanker`
  contract from `@graphorin/memory/search`.
