---
'@graphorin/store-sqlite': patch
---

Fix session-tier reads ignoring `SessionScope.userId` (e2e 2026-07-13, SESSIONS-01, security). `SessionMemoryStore.list`, `listWithMetadata`, `count`, and `search` filtered on `scope_session_id` alone, so a caller who knew another user's session id could read that user's transcript. All four reads now also scope by `scope_user_id`, so a mismatched user sees nothing while the owner reads their own session unchanged. Regression test pins that a different user with the same session id gets zero rows.
