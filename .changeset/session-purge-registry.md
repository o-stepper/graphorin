---
'@graphorin/store-sqlite': minor
'@graphorin/core': patch
---

W-029/W-060: schema-driven session-content erasure via the exported `SESSION_SCOPED_PURGES` registry + a completeness gate test.

`deleteSession`/`pruneSessions` previously purged only `session_messages` and `episodes`; consolidator-distilled facts (with their FTS/vec rows and entity links), insights, rules, working blocks, spans, consolidator state/runs and `memory_history` values all survived a hard-delete and stayed findable through semantic search. The purge is now a loop over a declarative registry (`SESSION_SCOPED_PURGES`, each entry naming the session column, FTS shadow, vec0 sidecar family, FK-referencing tables and memory-history scrub policy), with `SESSION_TABLE_EXEMPTIONS` documenting the tables the cascade handles directly. A schema-introspection gate test diffs the registry against every live table carrying `scope_session_id`/`session_id` - adding a new session-scoped table without an erasure decision fails the suite. Only rows scoped to the deleted session are removed; user-level rows (`scope_session_id IS NULL`) are untouched. BEHAVIOR CHANGE: session-scoped facts and insights no longer survive session deletion.
