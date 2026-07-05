---
'@graphorin/store-sqlite': patch
---

CS-10 guard completeness (W-113): `rules_fts` (added by migration 028) is now covered by the FTS-to-rowid integrity check - previously the newest FTS index escaped the orphan-row scan entirely. A coverage self-check test enumerates the `%_fts` virtual tables of a fully-migrated database against the registered pairs, so a future FTS index missing from `FTS_PAIRS` fails the suite instead of silently escaping the guard (`listCheckedFtsTables` is exported `@internal` for that test).
