---
'@graphorin/security': minor
'@graphorin/server': patch
---

W-011: cross-process fencing for the audit hash chain. `AuditDb` gains an optional `transact` member (BEGIN-IMMEDIATE semantics, additive - custom bindings keep compiling); the default binding in `@graphorin/server` implements it with rollback strictly in `finally`. `appendAudit` wraps its `latest()`+`insert()` read-modify-write in the fence, so two processes sharing one audit.db can no longer hash against the same tip; on bindings WITHOUT the fence a seq primary-key collision is now retried (bounded, re-reading the tip) instead of silently dropping the losing security entry. `pruneAudit` runs its delete + suffix re-hash inside ONE transaction - a concurrent append waits for the lock and chains to the post-prune tip instead of leaving a permanent verify break - and FAILS CLOSED on bindings without `transact` (an unsafe prune is worse than a refused one). Verified with worker-thread contention tests against a real encrypted audit.db.
