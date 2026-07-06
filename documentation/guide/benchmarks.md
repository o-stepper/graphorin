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

> [!IMPORTANT]
> No real-provider run has been published yet. The sections below render the plumbing fixture so the page, the generator, and the CI drift gate are wired end to end; quality numbers land here with the first maintainer-published real run (see `benchmarks/longmemeval/baselines/published/README.md`).

## Comparing with other systems

Mem0, Zep, and Letta publish LOCOMO / LongMemEval numbers under their own harnesses, judges, and case selections. Cross-system tables without identical conditions mislead more than they inform, so this page links methodologies instead of merging tables: read their published methods next to the `benchConfig` conditions printed here and compare like with like.

## Published reports
### `longmemeval.plumbing-fixture.json`

> [!CAUTION]
> **Plumbing-only fixture.** This report ran on a stub provider/judge; its numbers verify the harness wiring, NOT memory quality. It will be replaced by the first published real-provider run.

Run conditions (from the stamped `benchConfig` of the committed report):

| Condition | Value |
|---|---|
| Loader | `longmemeval` |
| Mode | `memory` |
| Retrieval | `default` (topK 12, consolidate false) |
| Embedder | `none` |
| Provider | `stub (plumbing-only)` |
| Judge | `stub (plumbing-only)` (non-self) |
| Iterations | 1 |

| Metric | Value |
|---|---|
| Cases | 3 |
| Pass rate | 66.7% (95% Wilson CI 20.8% to 93.9%) |
| Abstention rate | 0.0% |

| Scorer | Pass | Fail | Avg score |
|---|---:|---:|---:|
| `abstention` | 2 | 1 | 0.000 |
| `llm-judge-j` | 3 | 0 | 0.800 |

