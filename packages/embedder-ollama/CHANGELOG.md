# @graphorin/embedder-ollama

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release. First-class opt-in alternative to
  `@graphorin/embedder-transformersjs`. Wraps the local Ollama HTTP
  API for in-process-friendly embedding via `nomic-embed-text` (default),
  `mxbai-embed-large`, `snowflake-arctic-embed`, and `bge-m3`.
