---
'@graphorin/evals': minor
---

LOCOMO loader fidelity (W-022): `MemoryEvalTurn` gains an optional `speaker` field carrying the dataset-native speaker NAME alongside the two-role mapping - most LOCOMO questions reference speakers by name, and the LongMemEval benchmark runner now renders `<speaker>: ...` in both the full-context prompt and the ingested memory text. Numeric LOCOMO reference answers (e.g. `2022` - 6 of the 1986 QA pairs) are stringified instead of silently collapsing to `expected: ''`; QA pairs with no reference answer at all are SKIPPED rather than emitted, so the LLM judge never grades against an empty reference (documented in the module docs; this reduces the case count for such pairs). Any locally seeded LOCOMO baselines should be re-seeded - the ingested text changed; the committed stub-fixture CI baseline is unaffected.
