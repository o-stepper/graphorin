---
title: Evals & benchmarks
description: Offline-first eval harness — a parallel runner, code/LLM/trajectory scorers, regression gating against a baseline, dataset loaders (LongMemEval, LOCOMO), and terminal/markdown/JSON/JUnit/HTML reporters.
---

# Evals & benchmarks

`@graphorin/evals` is an offline-first evaluation harness for agents built on Graphorin. It runs a dataset of cases through your agent, scores each result, renders a report, and can fail CI on a regression against a stored baseline.

The harness itself does **no network I/O**. A run only talks to a model when the `agent` you pass is wired to a real provider — otherwise (a stub agent, a fixture provider) the whole thing runs fully offline, which is how the smoke benchmarks run in CI.

## A run at a glance

```ts
import {
  runEvals,
  loadJsonlDataset,
  exactMatch,
  renderTerminalReport,
  exitOnFailures,
} from '@graphorin/evals';

const dataset = await loadJsonlDataset('./fixtures/golden.jsonl');
const report = await runEvals({
  agent,
  dataset,
  scorers: [exactMatch()],
  concurrency: 4,
});
console.log(renderTerminalReport(report));
exitOnFailures(report); // exit non-zero if any case failed
```

`runEvals` drives `agent.run(...)` per case, runs every scorer against the result, and aggregates pass-rate, mean score, and duration into an `EvalReport`. Cases run with the configured `concurrency`; on abort it still returns the completed results as a partial report.

## Scorers

A scorer takes the case input + the agent's output and returns a `{ passed, score, ... }` verdict. Compose as many as you need — a case passes when every scorer passes.

- **`code/`** — deterministic, no model: `exactMatch`, `regexMatch` (stateless — `/g`/`/y` flags are stripped per case), `jsonPath`, and arbitrary `predicate` scorers.
- **`llm/`** — an LLM-as-judge scorer (`llmJudge`) for open-ended answers. Hardened against prompt injection in the candidate output; a judge that fails to parse surfaces a scorer error rather than a silent zero.
- **`prebuilt/`** — ready-made `toxicityScorer`, `factualityScorer`, `helpfulnessScorer`.
- **`trajectory/`** — score the *path*, not just the answer: correct-tool-selected, argument-validity, redundant-call detection, recovery-after-error, and final-state-correctness.

## Datasets

Loaders return a uniform case list:

- **`loadJsonlDataset` / `loadCsvDataset`** — your own golden files.
- **`loadDatasetFromTraces`** — replay persisted run traces as eval cases.
- **`loadLongMemEvalDataset`** — the real [LongMemEval](https://arxiv.org/abs/2410.10813) long-term-memory benchmark (ICLR 2025).
- **`loadLocomoDataset`** — the real [LOCOMO](https://arxiv.org/abs/2402.17753) multi-session conversational-memory benchmark.

The LongMemEval / LOCOMO datasets are not bundled; fetch them with `scripts/fetch-eval-datasets.mjs` (an explicit, user-initiated download), then point the loader at the local path. Downloads are integrity-checked: every dataset is pinned in `scripts/datasets.lock.json` (SHA-256 + immutable-revision source URL), already-present files are re-verified rather than trusted, and a `GRAPHORIN_*_URL` env override changes the source but not the required hash. A hash mismatch fails loudly; re-pin deliberately with `--force --update-lock`.

## Reporters

Render the same `EvalReport` for humans or machines: `renderTerminalReport`, `renderMarkdownReport`, `renderJsonReport`, `renderJunitReport` (CI test-result XML), and `renderHtmlReport`.

## Regression gating

`detectRegressions(current, baseline, tolerances)` compares a fresh report against a stored baseline and flags drops beyond your tolerances (pass-rate, mean-score, duration). The duration gate is **opt-in and absolute** (a finite ms budget on the mean-duration delta; it defaults to off so it does not false-positive across runner hardware). Seed a baseline from a known-good run, commit it, and gate future runs against it.

## Benchmarks

The `benchmarks/*` workspaces wrap the harness for specific suites — `benchmark-longmemeval`, `benchmark-memory-smoke`, `benchmark-memory-sim`, `benchmark-latency`, and others.The `longmemeval` benchmark ships the full provider matrix: `--provider stub` (deterministic, offline, plumbing-only) plus a real-provider mode (`--provider ollama|llamacpp|openai-compatible` with `--model`, or the `GRAPHORIN_BENCH_*` env vars); the other benchmarks are stub/fixture-driven. Results stamp the provider, mode, and tokens/query so a number is never reported without the conditions that produced it.

> Real-provider benchmark runs cost real model calls; they are never run by default. The offline stub mode is what keeps the suite green in CI.

## Next steps

- [Observability](/guide/observability) — the trace primitives evals build on.
- [Memory system](/guide/memory-system) — what the memory benchmarks exercise.
- [Agent runtime](/guide/agent-runtime) — the `agent.run(...)` surface a run drives.

---

**Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko

## Honest LongMemEval runs (C8)

The LongMemEval runner measures the REAL search path — the old harness-side
keyword fan-out booster is gone — and every report stamps a `benchConfig`
block, so a number always says what configuration produced it:

- `--retrieval default|multi-query|hyde|iterative|graph` and
  `--embedder none|fake` A/B the library's actual retrieval features
  (`multiQuery`/`hyde` wire a query transformer, `iterative` wires the graded
  `searchIterative` loop and reports its abstentions, `graph` enables entity
  resolution + one-hop expansion). `fake` is a deterministic bag-of-words
  hash embedder for exercising the vector leg offline; real quality needs a
  real embedder.
- `--judge-provider/--judge-model/--judge-base-url` (or
  `GRAPHORIN_BENCH_JUDGE_*`) grade with a model that is NOT the system under
  test. A self-judged real-provider run WARNs, stamps `selfJudged: true`,
  and refuses to write a `--json` baseline unless `--allow-self-judge`.
- `--iterations N` repeats every case and RESULTS reports the pass rate as
  mean ± stddev; the abstention rate over abstention-ability cases is
  always reported.

The adaptive injected-task scenarios (verbatim / unicode-obfuscated /
split / paraphrase exfiltration against the dataflow policy) live in
`packages/agent/tests/injection-scenarios.test.ts` and gate the security
claims both ways: the paraphrase gap of the default policy is asserted AS
a gap, and `derivedTaint: 'strict'` is asserted to close it.
