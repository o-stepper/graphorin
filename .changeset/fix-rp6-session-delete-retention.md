---
'@graphorin/sessions': minor
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
---

feat(sessions): session deletion / retention + push-to-closed guard (RP-6)

`SessionStore` had no way to delete a session or enforce retention, so metadata,
handoffs, workflow attachments, and audit rows accumulated forever — a problem
for long-living assistants. `Session.push` also ignored `closedAt`, making
`close()` purely advisory.

- New `SessionStoreExt.deleteSession(id)` (cascade handoffs / workflow runs /
  audit) and `pruneSessions({ beforeEpochMs?, closedOnly? })` retention sweep
  (core); `@graphorin/store-sqlite` implements both in a transaction, and its
  store handle now exposes `sessions` as the richer `SessionStoreExt`.
- `SessionManager` gains `deleteSession` / `pruneSessions`; message rows live in
  the memory store and are purged separately.
- `Session.push` now throws the new `SessionClosedError` when the session is
  closed (best-effort same-instance guard; multi-writer stays last-write-wins).

Red-first: a real-sqlite test asserts `deleteSession` removes the session and
its handoffs / workflow runs / audit rows, and `pruneSessions({ closedOnly })`
sweeps a closed session while keeping an open one; a facade test asserts the
manager cascade + that pushing to a closed session throws.
