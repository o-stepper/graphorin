---
'@graphorin/benchmark-longmemeval': minor
'@graphorin/agent': patch
---

Eval honesty (audit 2026-07-04 Wave C, cluster C8; pairs evals-01..07/09).

The LongMemEval runner drops the harness-side keyword fan-out booster (numbers now measure the real search path), gains `--retrieval default|multi-query|hyde|iterative|graph` + `--embedder none|fake` A/B switches that wire the real library config, stamps a `benchConfig` block into every report, grades with a dedicated `--judge-provider` (self-judged real runs WARN and refuse to seed `--json` baselines without `--allow-self-judge`), reports pass rate as mean +/- stddev under `--iterations N` plus an abstention-rate aggregate, caches the in-flight ingest PROMISE (no concurrent double-ingest), and ships a committed deterministic stub+fixture baseline exercised by a new offline plumbing-gate step in the dispatch workflow. New adaptive injected-task scenarios (verbatim / unicode-obfuscated / split / paraphrase) gate the dataflow-policy defense claims both ways in the agent test suite.
