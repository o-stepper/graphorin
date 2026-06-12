---
'@graphorin/workflow': patch
---

fix(workflow): advance the step counter on resume so post-resume checkpoints never tie (WF-4)

`resumeEngine` restored `stepNumber` to the suspended checkpoint's value and the
suspend path persisted without incrementing, so the first post-resume checkpoint
**tied** the suspended one. At a tie `getTuple` (max `stepNumber`) is ambiguous
and both stores resolve it to the *stale* row (in-memory keeps the first seen;
SQLite's `ORDER BY step_number DESC` returns the lower rowid) — so a crash
between checkpoints re-ran the already-executed pause node, and a node that
pauses twice in a row livelocked forever.

The step counter is now strictly monotonic through resume (incremented on resume
entry), so every post-resume checkpoint is strictly newer than the suspended
one. This is the engine-level (store-agnostic) fix, so it holds for both
checkpoint stores. A regression test asserts the suspended `stepNumber` is unique
in the store after resume. (Adding explicit `getTuple` tie-breakers to each store
remains a defensive follow-up; the engine no longer produces ties.)
