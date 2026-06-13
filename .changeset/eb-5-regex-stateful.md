---
'@graphorin/evals': patch
---

Make `regexMatch` deterministic across cases (EB-5).

`regexMatch` called `.test()` directly on the caller-supplied `RegExp`. A
pattern carrying the `/g` or `/y` flag is **stateful** — `.test()` advances
`lastIndex` — so reusing the same scorer across a dataset (or across
`iterations > 1`) made later cases match against a moved cursor: an identical
output that passed the first case could spuriously fail the next, or vice versa.

The scorer now matches against a clone with the stateful flags (`g`/`y`)
stripped — a whole-string `.test()` never needs them — while preserving the
other flags (`i`/`m`/`s`/`u`). The caller's `RegExp` is never mutated.
