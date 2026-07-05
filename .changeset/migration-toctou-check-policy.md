---
'@graphorin/store-sqlite': minor
'@graphorin/cli': minor
---

W-068: migration-runner TOCTOU fence + read-only CLI commands stop auto-migrating live databases.

`runMigrations` re-checks `schema_migrations` INSIDE each per-migration IMMEDIATE transaction: when two processes race to migrate one file, the loser now skips (no-op) instead of crashing on non-idempotent SQL ("duplicate column name"). New read-only `pendingMigrations(conn)` helper reads `sqlite_master` first, so probing a foreign database never marks it by creating the bookkeeping table. The CLI store context gains `migrationPolicy: 'apply' | 'check'`; read-only commands (`memory inspect`/`activity`, `traces status|prune`, `triggers list`, `consolidator status`/`dlq-list`) now run with `'check'`: a newer CLI pointed at a running (older) server's database refuses with "schema is N migration(s) behind ... run 'graphorin migrate' (with the server stopped) or use a CLI version matching the server" instead of silently upgrading the schema under the live process. BEHAVIOR CHANGE: those commands now also refuse on a never-migrated database instead of creating the schema as a side effect.
