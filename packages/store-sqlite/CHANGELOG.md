# @graphorin/store-sqlite

## 0.1.0

### Minor Changes

- Initial release. Default SQLite-backed persistence for the Graphorin
  framework — implements every storage contract from `@graphorin/core`
  on top of `better-sqlite3` with WAL hardening, an atomic migration
  runner, multi-table per-embedder vec0 vector layout, multilingual
  FTS5, and an encryption-or-fail-fast hook for the optional
  `@graphorin/store-sqlite-encrypted` cipher subpackage.
