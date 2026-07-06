---
'@graphorin/memory': minor
---

W-088: the iterative-retrieval difficulty gate is now tunable. New `difficultyThreshold` on `IterativeSearchOptions` (per-call) and on `createMemory({ iterativeRetrieval })` (construction-time default; per-call wins). The default stays the conservative built-in `0.5`. The guide now states plainly that the gate's signal lexicon is English-only - on non-English deployments lower the threshold or use `forceHard` (`deep_recall` already forces the loop) - and that a mis-gated call still returns a valid single-shot result.
