# @graphorin/reranker-transformersjs

## 0.1.0

### Minor Changes

- Initial release of the cross-encoder reranker adapter for the Graphorin
  framework. Wraps `@huggingface/transformers@^4.1.0`, automatically picks
  the BGE reranker model from the agent locale, supports lazy load + idle
  unload, and implements the `ReRanker` contract from
  `@graphorin/memory/search`.
