# @graphorin/store-sqlite

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release. Default SQLite-backed persistence for the Graphorin
  framework - implements every storage contract from `@graphorin/core`
  on top of `better-sqlite3` with WAL hardening, an atomic migration
  runner, multi-table per-embedder vec0 vector layout, multilingual
  FTS5, and an encryption-or-fail-fast hook for the optional
  `@graphorin/store-sqlite-encrypted` cipher subpackage.
