---
'@graphorin/evals': patch
---

P0-1 — real memory-eval harness (see `memory-improvement-proposals.md` §5,
summary-table row **P0-1 · Real eval harness (LongMemEval + LOCOMO + DMR,
LLM-judge, CI gates)**). Replaces the misleadingly-named synthetic benchmark
with a real, reproducible harness so every later memory change becomes
*measured* rather than *plausible*.

`@graphorin/evals` gains three dataset loaders — `loadLongMemEvalDataset`,
`loadLocomoDataset`, `loadDmrDataset` (plus their `parse*` cores) — and the
shared **system-under-test** contract they map each dataset's native JSON onto:
`MemoryEvalInput` / `MemoryEvalSession` / `MemoryEvalTurn` / `MemoryEvalAbility`
(input = haystack sessions + question; expected = reference answer for the
LLM-judge "J" score). The loaders are pure, read local files only (no network —
`check-no-network` stays green) and add no `@graphorin/memory` dependency, so
the harness stays generic. Purely additive → `patch`.

Consumed by a new private `@graphorin/benchmark-longmemeval` package: a
`MemorySystemAgent` ingests each question's sessions into a fresh in-memory
`@graphorin/memory` instance and answers from recall via the configured
`Provider`; answers are graded by `llmJudge` plus a per-ability abstention
scorer, with per-category regression gates (`detectRegressions`) against stored
baselines. Real datasets download on demand via the dev-only
`scripts/fetch-eval-datasets.mjs` and run in a dispatch-only CI job
(`.github/workflows/benchmark-longmemeval.yml`); a tiny committed fixture + a
deterministic stub provider keep the offline smoke test network-free. The
synthetic `@graphorin/benchmark-locomo` is relabelled
`@graphorin/benchmark-memory-smoke` so it stops masquerading as the published
LOCOMO benchmark.
