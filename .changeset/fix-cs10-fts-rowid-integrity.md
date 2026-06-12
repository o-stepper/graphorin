---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): guard FTS↔rowid integrity + document the never-VACUUM rule (CS-10)

The FTS5 keyword indexes key on each base row's implicit `rowid` (FTS rows are
written `rowid = (SELECT rowid FROM <base> WHERE id = ?)` and searches join
`base.rowid = fts.rowid`). SQLite may renumber implicit rowids on `VACUUM`,
which would silently re-point every search hit at a different record. Graphorin
never issues `VACUUM`, and the encrypted export path copies the database file
byte-for-byte (CS-7) before an in-place rekey, so the hazard is latent — but a
hand-run `VACUUM` would corrupt search.

Per the audit's minimum remedy (assertion + docs), this adds a loud guard
rather than reworking the schema:

- New `checkFtsIntegrity(connection)` / `formatFtsIntegrityWarning(...)` — a
  cheap orphan-row scan across the four FTS tables, exported for `graphorin
  doctor` and post-maintenance verification.
- `createSqliteStore` runs the check at open and emits a warning (via the new
  `warn` option, default `console.warn`) when drift is found; non-fatal.
  `skipFtsIntegrityCheck: true` opts out for very large stores.
- Storage + persistence guides now carry a prominent "never VACUUM" warning
  pointing at the rowid-preserving `encrypt`/`rekey` maintenance path.

Red-first: real-sqlite tests assert a clean store reports no orphans, an
injected orphan FTS row is detected + formatted with a VACUUM-aware message,
the open-time warning fires on a drifted store, and `skipFtsIntegrityCheck`
suppresses it.
