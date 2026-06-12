---
'@graphorin/memory': minor
---

MCON-16: the advertised ExpeL forgetting loop for insights actually
runs. Each reflection pass decays every existing insight's salience by
1 (fresh insights from the same pass are exempt), and retrieval through
`InsightMemory.search` reinforces recalled insights by +1 — so a
recalled-since-last-pass insight nets level-or-better while an unused
one slides from the starting salience 2 to the prune floor in two idle
passes. Previously `bumpSalience` had no callers at all: salience was
frozen at 2 and the per-pass `prune()` was a guaranteed no-op.
