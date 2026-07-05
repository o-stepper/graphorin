# @graphorin/reranker-transformersjs

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the cross-encoder reranker adapter for the Graphorin
  framework. Wraps `@huggingface/transformers@^4.1.0`, automatically picks
  the BGE reranker model from the agent locale, supports lazy load + idle
  unload, and implements the `ReRanker` contract from
  `@graphorin/memory/search`.
