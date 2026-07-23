---
title: Benchmarks
description: Memory-quality benchmark results rendered from committed, benchConfig-stamped harness reports.
---

<!-- GENERATED FILE - do not edit by hand. -->
<!-- Source: benchmarks/longmemeval/baselines/published/*.json -->
<!-- Regenerate: node documentation/scripts/build-benchmark-results.mjs --update -->

# Benchmarks

> [!WARNING]
> Numbers are workstation numbers: single machine, committed run conditions, no tuning-for-the-test. Every figure on this page is rendered from a committed JSON report and CI fails if the page drifts from those artifacts. Read the conditions table next to each number before comparing anything.

The [evals guide](/guide/evals) documents the harness itself: non-self judging, Wilson intervals, abstention scoring, and the A/B switches. This page holds the published results.

## Comparing with other systems

Mem0, Zep, and Letta publish LOCOMO / LongMemEval numbers under their own harnesses, judges, and case selections. Cross-system tables without identical conditions mislead more than they inform, so this page links methodologies instead of merging tables: read their published methods next to the `benchConfig` conditions printed here and compare like with like.

## Published reports
### `halumem.operations.conflict-off.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Stage | `operations` |
| Conflict pipeline | `off` |
| Embedder | `fake` |
| Provider | `openai-compatible:gpt-5-mini` |
| Dataset | `benchmarks/halumem/fixtures/halumem.synthetic.json` (sha256 `31a82043d0ad…`) |
| Observed cost | $0.0202 (cap $2) |

| Metric | Value |
|---|---|
| Cases | 4 |
| Pass rate | 25.0% (95% Wilson CI 4.6% to 69.9%) |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `memory-extraction-precision` | 4 | 0 | 0.938 |
| `memory-extraction-recall` | 4 | 0 | 0.875 |
| `memory-update-omission` | 1 | 3 | 0.250 |

### `halumem.operations.conflict-on.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Stage | `operations` |
| Conflict pipeline | `on` |
| Embedder | `fake` |
| Provider | `openai-compatible:gpt-5-mini` |
| Dataset | `benchmarks/halumem/fixtures/halumem.synthetic.json` (sha256 `31a82043d0ad…`) |
| Observed cost | $0.0241 (cap $2) |

| Metric | Value |
|---|---|
| Cases | 4 |
| Pass rate | 25.0% (95% Wilson CI 4.6% to 69.9%) |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `memory-extraction-precision` | 3 | 1 | 0.667 |
| `memory-extraction-recall` | 3 | 1 | 0.750 |
| `memory-update-omission` | 2 | 2 | 0.500 |

### `longmemeval.full.gpt-5-mini-full-context.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Loader | `longmemeval` (variant S) |
| Mode | `full-context` |
| Retrieval | `default` (topK 12, consolidate false) |
| Embedder | `none` |
| Provider | `openai-compatible:gpt-5-mini` |
| Judge | `ollama:qwen3:8b-q4_K_M` (non-self) |
| Iterations | 1 |
| Dataset | `benchmarks/.datasets/longmemeval_s.json` (sha256 `08d8dad4be43…`) |
| Observed cost | $14.1280 (cap $24) |

| Metric | Value |
|---|---|
| Cases | 500 |
| Pass rate | 82.0% (95% Wilson CI 78.4% to 85.1%) |
| Abstention rate | 90.0% |
| Tokens/query | 110092 |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `abstention` | 497 | 3 | 0.900 |
| `llm-judge-j` | 410 | 90 | 0.841 |

### `longmemeval.full.gpt-5-mini-memory.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Loader | `longmemeval` (variant S) |
| Mode | `memory` |
| Retrieval | `default` (topK 12, consolidate false) |
| Embedder | `none` |
| Provider | `openai-compatible:gpt-5-mini` |
| Judge | `ollama:qwen3:8b-q4_K_M` (non-self) |
| Iterations | 3 |
| Dataset | `benchmarks/.datasets/longmemeval_s.json` (sha256 `08d8dad4be43…`) |
| Observed cost | $1.8930 (cap $8) |

| Metric | Value |
|---|---|
| Cases | 1500 |
| Pass rate | 73.3% (95% Wilson CI 71.0% to 75.5%) |
| Abstention rate | 90.0% |
| Tokens/query | 3321 |
| Pass-rate stddev across iterations | 0.7% |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `abstention` | 1491 | 9 | 0.900 |
| `llm-judge-j` | 1102 | 398 | 0.779 |

### `longmemeval.full.gpt-5-nano-memory.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Loader | `longmemeval` (variant S) |
| Mode | `memory` |
| Retrieval | `default` (topK 12, consolidate false) |
| Embedder | `none` |
| Provider | `openai-compatible:gpt-5-nano` |
| Judge | `ollama:qwen3:8b-q4_K_M` (non-self) |
| Iterations | 3 |
| Dataset | `benchmarks/.datasets/longmemeval_s.json` (sha256 `08d8dad4be43…`) |
| Observed cost | $0.6954 (cap $3) |

| Metric | Value |
|---|---|
| Cases | 1500 |
| Pass rate | 65.5% (95% Wilson CI 63.1% to 67.9%) |
| Abstention rate | 93.3% |
| Tokens/query | 3690 |
| Pass-rate stddev across iterations | 1.5% |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `abstention` | 1494 | 6 | 0.933 |
| `llm-judge-j` | 983 | 517 | 0.704 |

### `longmemeval.full.gpt-5.6-luna-memory.json`

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Loader | `longmemeval` (variant S) |
| Mode | `memory` |
| Retrieval | `default` (topK 12, consolidate false) |
| Embedder | `none` |
| Provider | `openai-compatible:gpt-5.6-luna` |
| Judge | `ollama:qwen3:8b-q4_K_M` (non-self) |
| Iterations | 3 |
| Dataset | `benchmarks/.datasets/longmemeval_s.json` (sha256 `08d8dad4be43…`) |
| Observed cost | $1.1973 (cap $20) |

| Metric | Value |
|---|---|
| Cases | 1500 |
| Pass rate | 72.2% (95% Wilson CI 69.9% to 74.4%) |
| Abstention rate | 90.0% |
| Tokens/query | 2958 |
| Pass-rate stddev across iterations | 0.2% |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `abstention` | 1491 | 9 | 0.900 |
| `llm-judge-j` | 1084 | 416 | 0.757 |

### Subject / mode matrix (`longmemeval`)

| Subject | Mode | Iterations | Pass rate | 95% CI | Tokens/query | Observed cost | Report |
|---|---|---|---|---|---|---|---|
| `gpt-5-mini` | `full-context` | 1 | 82.0% | 78.4% to 85.1% | 110092 | $14.1280 (cap $24) | `longmemeval.full.gpt-5-mini-full-context.json` |
| `gpt-5-mini` | `memory` | 3 | 73.3% | 71.0% to 75.5% | 3321 | $1.8930 (cap $8) | `longmemeval.full.gpt-5-mini-memory.json` |
| `gpt-5-nano` | `memory` | 3 | 65.5% | 63.1% to 67.9% | 3690 | $0.6954 (cap $3) | `longmemeval.full.gpt-5-nano-memory.json` |
| `gpt-5.6-luna` | `memory` | 3 | 72.2% | 69.9% to 74.4% | 2958 | $1.1973 (cap $20) | `longmemeval.full.gpt-5.6-luna-memory.json` |

### Conflict-pipeline A/B (`halumem` operations)

The synthetic operations fixture holds 4 cases. At that size, run-to-run LLM-extraction variance can exceed the difference between the arms - this table proves the A/B axis is wired and config-stamped, not a quality conclusion; drawing one needs a larger operations dataset.

| Conflict pipeline | Per-scorer pass/fail | Observed cost | Report |
|---|---|---|---|
| `off` | `memory-extraction-precision` 4/4, `memory-extraction-recall` 4/4, `memory-update-omission` 1/4 | $0.0202 (cap $2) | `halumem.operations.conflict-off.json` |
| `on` | `memory-extraction-precision` 3/4, `memory-extraction-recall` 3/4, `memory-update-omission` 2/4 | $0.0241 (cap $2) | `halumem.operations.conflict-on.json` |

