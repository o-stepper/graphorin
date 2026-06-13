---
'@graphorin/sessions': minor
---

feat(sessions): default Session.replay() to a persisted-span source (RP-17, part 2)

`Session.replay()` defaulted its `traceSource` to an empty iterable, so a
no-argument replay emitted only `replay.start` / `replay.end` — no real run.

`createSessionManager` now accepts an optional `replayTraceSource(sessionId)`
factory; when a session is replayed without an explicit `traceSource`, the
manager resolves the persisted spans through it. Wire it to the new
`@graphorin/store-sqlite` helper —
`replayTraceSource: (id) => traceSourceForSession(store.connection, id)` — and
`session.replay()` reproduces the recorded run. Without the factory, behaviour
is unchanged (empty source).
