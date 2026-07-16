---
'@graphorin/store-sqlite': patch
---

Fix a working-block second mutation crashing under a partial (NULL) scope (e2e 2026-07-13, MEMORY-C-01, critical). A block written under a scope with a NULL session or agent id (for example the wave-D user-only profile block, scope `{ userId }`) could not be mutated a second time: the `(scope_user_id, scope_session_id, scope_agent_id, label)` UNIQUE index does not treat NULLs as equal, so the `ON CONFLICT` upsert never matched and the write collided on the PRIMARY KEY `id` with `UNIQUE constraint failed: working_blocks.id`. `WorkingMemoryStoreImpl.upsert` now resolves the existing row with the same NULL-safe `COALESCE` semantics the rest of the store already uses for reads/deletes, then updates it in place (preserving `id` and `created_at`, reviving a soft-deleted row) or inserts fresh. A regression test covers repeated upserts under both a user-only scope and a user+session scope.
