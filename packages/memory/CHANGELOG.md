# @graphorin/memory

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

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
