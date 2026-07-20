---
title: Evals & benchmarks
description: Offline-first eval harness - a parallel runner, code/LLM/trajectory scorers, regression gating against a baseline, dataset loaders (LongMemEval, LOCOMO), and terminal/markdown/JSON/JUnit/HTML reporters.
---

# Evals & benchmarks

`@graphorin/evals` is an offline-first evaluation harness for agents built on Graphorin. It runs a dataset of cases through your agent, scores each result, renders a report, and can fail CI on a regression against a stored baseline.

The harness itself does **no network I/O**. A run only talks to a model when the `agent` you pass is wired to a real provider - otherwise (a stub agent, a fixture provider) the whole thing runs fully offline, which is how the smoke benchmarks run in CI.

## A run at a glance

```ts
import {
  runEvals,
  loadJsonlDataset,
  exactMatch,
  renderTerminalReport,
  exitOnFailures,
} from '@graphorin/evals';

// Anything with a `run(input)` method is an agent to the runner - here a
// trivial offline stub that tolerates parallel calls. A real Graphorin
// `Agent` allows only ONE run in flight per instance: at `concurrency > 1`
// pass `agentFactory: () => createAgent({...})` (one agent per worker)
// instead of a shared `agent`.
const agent = { run: async (input: unknown) => input };

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

A shared `agent` must tolerate overlapping `run()` calls. A framework `Agent` does not (one run in flight per instance, guarded by `ConcurrentRunError`), so for parallel runs pass `agentFactory` instead - the runner invokes it once per worker so every worker drives its own instance. If a shared instance trips the guard anyway, the runner fails fast with an `EvalConcurrencyError` that names the remedy, rather than recording the whole dataset as scorer failures.

```ts
import { exactMatch, fromIterable, runEvals } from '@graphorin/evals';

// One agent per worker - required for a real Graphorin `Agent`, which
// permits a single run in flight per instance. The stub stands in for
// `() => createAgent({...})`.
const report = await runEvals({
  agentFactory: () => ({ run: async (input: string) => input }),
  dataset: fromIterable([{ input: 'ping', expected: 'ping' }]),
  scorers: [exactMatch()],
  concurrency: 4,
});
console.log(report.summary.passed);
```

## Scorers

A scorer takes the case input + the agent's output and returns a `{ pass, score, ... }` verdict. Compose as many as you need - a case passes when every scorer passes.

- **`code/`** - deterministic, no model: `exactMatch`, `regexMatch` (stateless - `/g`/`/y` flags are stripped per case), `jsonPath`, and arbitrary `predicate` scorers.
- **`llm/`** - an LLM-as-judge scorer (`llmJudge`) for open-ended answers. Hardened against prompt injection in the candidate output; a judge that fails to parse surfaces a scorer error rather than a silent zero.
- **`memory/`** - operation-level memory metrics over HaluMem-format gold points: deterministic `memoryExtractionRecall` / `memoryExtractionPrecision` / `memoryUpdateOmission` (token-F1 matching by default, custom matchers supported) plus the judged `memoryQaHallucination`. They grade the memory *write pipeline* - what was extracted, updated, deleted - not just final answers.
- **`prebuilt/`** - ready-made `toxicityScorer`, `factualityScorer`, `helpfulnessScorer`.
- **`trajectory/`** - score the *path*, not just the answer: correct-tool-selected, argument-validity, redundant-call detection, recovery-after-error, and final-state-correctness.

## Datasets

Loaders return a uniform case list:

- **`loadJsonlDataset` / `loadCsvDataset`** - your own golden files.
- **`loadDatasetFromTraces`** - replay persisted run traces as eval cases.
- **`loadLongMemEvalDataset`** - the real [LongMemEval](https://arxiv.org/abs/2410.10813) long-term-memory benchmark (ICLR 2025).
- **`loadLocomoDataset`** - the real [LOCOMO](https://arxiv.org/abs/2402.17753) multi-session conversational-memory benchmark.
- **`loadHaluMemDataset`** - operation-level (HaluMem-style, [arXiv:2511.03506](https://arxiv.org/abs/2511.03506)) datasets carrying per-session gold memory points (`extract` / `update` / `delete`) plus QA probes. `stage: 'operations'` expands one case per sample for the write-pipeline scorers; `stage: 'qa'` one case per probe question. The loader reads a user-supplied local JSON path in the documented shape (see the `halumem.ts` module docs); obtaining a real dataset is a manual, user-initiated step - small synthetic fixtures in the same format keep CI deterministic.

The LongMemEval / LOCOMO datasets are not bundled; fetch them with `scripts/fetch-eval-datasets.mjs` (an explicit, user-initiated download), then point the loader at the local path. Downloads are integrity-checked: every dataset is pinned in `scripts/datasets.lock.json` (SHA-256 + immutable-revision source URL), already-present files are re-verified rather than trusted, and a `GRAPHORIN_*_URL` env override changes the source but not the required hash. A hash mismatch fails loudly; re-pin deliberately with `--force --update-lock`.

## Reporters

Render the same `EvalReport` for humans or machines: `renderTerminalReport`, `renderMarkdownReport`, `renderJsonReport`, `renderJunitReport` (CI test-result XML), and `renderHtmlReport`.

## Regression gating

`detectRegressions(current, baseline, tolerances)` compares a fresh report against a stored baseline and flags drops beyond your tolerances (pass-rate, mean-score, duration). The duration gate is **opt-in and absolute** (a finite ms budget on the mean-duration delta; it defaults to off so it does not false-positive across runner hardware). Seed a baseline from a known-good run, commit it, and gate future runs against it.

Reports now carry honest statistics: `summary.passRateCi` is a 95% Wilson interval on the pass rate, and under `iterations > 1` the summary adds `passHatK` (the fraction of base cases whose *every* repeat iteration passed - a flaky case fails pass^k while barely moving the mean). A `pass-rate-drop` finding is annotated with a paired **McNemar p-value** over the cases shared with the baseline; pass `requireSignificance: true` (with optional `significanceAlpha`, default 0.05) to keep a drop finding only when the paired test says the change is real - a fixed percentage tolerance alone is blind to sample size. The shared helpers (`wilsonInterval`, `passHatK`, `pairedPassSignificance`, `mean`, `sampleStddev`) are exported from `@graphorin/evals`.

## Benchmarks

The `benchmarks/*` workspaces wrap the harness for specific suites - `benchmark-longmemeval`, `benchmark-halumem`, `benchmark-memory-smoke`, `benchmark-memory-sim`, `benchmark-latency`, `benchmark-scale` (see [Performance & scale](/guide/performance)), and others. The `longmemeval` and `halumem` benchmarks ship the full provider matrix: `--provider stub` (deterministic, offline, plumbing-only) plus a real-provider mode (`--provider ollama|llamacpp|openai-compatible` with `--model`, or the `GRAPHORIN_BENCH_*` env vars); the other benchmarks are stub/fixture-driven. Results stamp the provider, mode, and tokens/query so a number is never reported without the conditions that produced it.

`benchmark-halumem` is the operation-level counterpart to the QA-level `longmemeval` suite: each case's sessions replay through the REAL ingest pipeline (`session.push` -> consolidator standard phase -> extraction -> conflict pipeline) into a fresh in-memory store, the post-ingest memory state is observed, and the staged `memory/` scorers grade it. Its `--conflict-pipeline on|off` axis is designed as the value proof for the neighbour-aware extract-reconcile-supersede path: run both legs and compare `memory-update-omission`. The comparison is only meaningful with a vector signal - pass `--embedder fake` (or a real embedder via the programmatic path), because the reconcile route is gated on an embedding-similarity mid-zone and an FTS-only store converges both legs to identical numbers. Both legs hold `autoPromoteExtraction: true` constant so the A/B isolates the reconcile path rather than the quarantine workflow. A measured on-vs-off improvement on real models is still an open baseline (the scheduled real-provider matrix), so treat the axis as the instrument, not as an already-proven win. Ingest failures (provider HTTP errors, consolidator faults) are stamped `INFRASTRUCTURE_FAILED` per case and the run exits non-zero - a `0/N` score line never doubles as a quality claim.

> Real-provider benchmark runs cost real model calls; they are never run by default. The offline stub mode is what keeps the suite green in CI.

## Next steps

- [Observability](/guide/observability) - the trace primitives evals build on.
- [Memory system](/guide/memory-system) - what the memory benchmarks exercise.
- [Agent runtime](/guide/agent-runtime) - the `agent.run(...)` surface a run drives.

## Honest LongMemEval runs

The LongMemEval runner measures the REAL search path - the old harness-side
keyword fan-out booster is gone - and every report stamps a `benchConfig`
block, so a number always says what configuration produced it:

- `--retrieval default|multi-query|hyde|iterative|graph|ppr|entity` and
  `--embedder none|fake` A/B the library's actual retrieval features
  (`multiQuery`/`hyde` wire a query transformer, `iterative` wires the graded
  `searchIterative` loop and reports its abstentions, `graph` enables entity
  resolution + one-hop expansion, `ppr` two-hop expansion with PPR scoring,
  `entity` the exact entity-match candidate leg). `fake` is a deterministic
  bag-of-words hash embedder for exercising the vector leg offline; real
  quality needs a real embedder.
- `--judge-provider/--judge-model/--judge-base-url` (or
  `GRAPHORIN_BENCH_JUDGE_*`) grade with a model that is NOT the system under
  test. A self-judged real-provider run WARNs, stamps `selfJudged: true`,
  and refuses to write a `--json` baseline unless `--allow-self-judge`.
- `--iterations N` repeats every case and RESULTS reports the pass rate as
  mean ± stddev; the abstention rate over abstention-ability cases is
  always reported.
- `--conflict-pipeline on|off` A/Bs the conflict pipeline instead of the
  historic hardcoded `off`; the mode is stamped into `benchConfig` and the
  RESULTS header. The update-omission A/B itself lives in
  `benchmark-halumem` - here the switch measures the pipeline's effect on
  QA quality.
- `--max-cost-usd N` puts a run-level USD ceiling over the resolved
  SUT + judge providers (`withCostLimit` composed over `withCostTracking`).
  Usage is priced by model id against the bundled pricing snapshot
  (`priceLookupByModel` from `@graphorin/pricing` - shared by the
  `longmemeval` and `halumem` runners), so the ceiling observes spend even
  through the vendor-agnostic `openai-compatible` adapter; for models the
  snapshot does not know the runner WARNs that the cap was effectively
  unenforced instead of pretending otherwise.

The adaptive injected-task scenarios (verbatim / unicode-obfuscated /
split / paraphrase exfiltration against the dataflow policy) live in
`packages/agent/tests/injection-scenarios.test.ts` and gate the security
claims both ways: the paraphrase gap of the default policy is asserted AS
a gap, and `derivedTaint: 'strict'` is asserted to close it.
