# @graphorin/memory

## 0.1.0

### Minor Changes

- Phase 10a — initial release of `@graphorin/memory`. Ships the
  `createMemory()` facade with six tier sub-modules (working,
  session, episodic, semantic, procedural, shared), nine memory
  tools registered through `@graphorin/tools`, the built-in
  `RRFReranker` with a pluggable `setReranker(...)` hook, the
  embedder migration runner with `lock-on-first` / `multi-active` /
  `auto-migrate` strategies, and the `compile()` / `metadata()` /
  `consolidator` interface stubs picked up by Phases 10b / 10c /
  10d.
