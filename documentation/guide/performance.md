---
title: Performance & scale
description: Measured practical limits of the SQLite-backed memory store - hybrid-search latency, graph expansion cost, consolidator pass time, and DB size at 100k facts - plus how to reproduce the numbers.
---

# Performance & scale

Graphorin's default store is a single local SQLite file (FTS5 + `sqlite-vec`
vec0 + an entity graph). This page documents where that stays comfortable,
measured by the repeatable scale probe in
[`benchmarks/scale`](https://github.com/o-stepper/graphorin/tree/main/benchmarks/scale)
(audit 2026-07-04, E7).

::: warning Numbers are workstation numbers
Wall-clock results below were measured on one developer machine (Apple
Silicon, local NVMe). Treat them as order-of-magnitude guidance, not a
contract; re-run the probe on your hardware (one command, below). CI gates
never assert absolute wall-clock values - only deterministic plumbing
(EB-4).
:::

## Measured at 100k facts

Corpus: 100,000 synthetic facts, every one carrying a 64-dim vector (vec0)
plus `s/p/o` entity links, seeded through the public
`memory.semantic.remember` path with entity resolution on. The probe's
deterministic bag-of-words embedder makes many entity names
embedding-identical, so resolution merges them into a small set of **extreme
hub canonicals** (127 canonical entities across 100k facts) - treat the graph
rows below as a dense-hub stress scenario, not a typical entity distribution.

Measured 2026-07-05 on an Apple Silicon workstation (local NVMe):

| Metric | Result |
| --- | --- |
| Seeding throughput (write path: FTS + vec0 + entity linking) | 388 facts/s (100k in ~4.3 min) |
| Hybrid search (FTS + vector + RRF), p50 / p95 over 200 queries | 103 / 321 ms |
| Graph-expanded search (`expandHops: 1`, `'ppr'`), p50 / p95, dense hubs | 1.8 / 2.0 s |
| Graph-expanded search (`expandHops: 2`, `'ppr'`), p50 / p95 over 5 queries | 89 / 99 s (documented hot spot) |
| Consolidator light phase (per-pass, ceiling-bounded) | < 0.1 s |
| DB size on disk (after WAL checkpoint) | 125.6 MiB (~1.3 KiB/fact) |

For contrast, at **2k facts** (the CI smoke corpus) the same probe measures
hybrid p95 ~5 ms and hop-1 graph p95 ~53 ms.

## Practical guidance

- **The vector leg is the read-path driver at scale.** vec0's KNN is a
  brute-force scan, so hybrid latency grows linearly with corpus size:
  ~5 ms p95 at 2k facts, ~320 ms p95 at 100k (64-dim). FTS-only recall stays
  in single-digit milliseconds throughout (see `benchmarks/latency`). If you
  need sub-100ms hybrid search beyond ~30-50k facts, shrink the vector
  dimension, shard by scope, or gate the vector leg per query.
- **Graph expansion is per-query opt-in for a reason.** Hop-1 cost scales
  with seed-candidate count x entity fanout: milliseconds on well-separated
  entities, ~2 s at 100k facts under dense hubs. Hop-2 re-expands the hub
  fanout per reached fact and lands in the tens of seconds there - keep
  `expandHops: 2` for offline/analysis flows, not interactive recall.
- **Writes are the expensive direction.** Every `remember` is an FTS insert +
  a vector insert + (with the graph on) entity resolution and linking;
  ~390 facts/s sustained on a workstation. Bulk imports should batch and can
  disable `graph.entityResolution` during the load, then backfill.
- **The consolidator light phase is ceiling-bounded per pass**, so a single
  pass stays sub-second regardless of corpus size; sweeping a large corpus is
  a matter of scheduled repeat passes (the default triggers do this), not one
  long blocking call.
- **DB size** budgets roughly linearly: ~1.3 KiB/fact at 64-dim vectors and
  short texts (vector table + FTS index dominate). 1M facts of this shape
  would be ~1.3 GiB.
- **Long-term growth is dominated by side tables, not facts.** Spans,
  idempotency response bodies, consolidator run counters, session audit rows,
  memory history and terminal workflow checkpoints all accumulate per
  *activity*, not per remembered fact. The standalone server sweeps the
  derived surfaces by default (`config.retention`); in lib-mode schedule the
  prune primitives yourself - see the
  [deployment guide](/guide/deployment#retention-and-database-growth).
- **One writer.** SQLite is single-writer: keep one process writing per DB
  file (the k8s template pins `replicas: 1` for exactly this reason).

## Reproducing

```bash
pnpm --filter @graphorin/benchmark-scale run build
node benchmarks/scale/dist/runner.js            # full profile: 100k facts
node benchmarks/scale/dist/runner.js --facts 10000
node benchmarks/scale/dist/runner.js --smoke    # CI plumbing gate (2k facts)
```

The probe writes `benchmarks/scale/RESULTS.md` with the same table as above.

## Related latency probes

- [`benchmarks/latency`](https://github.com/o-stepper/graphorin/tree/main/benchmarks/latency) -
  FTS-only search latency tripwire that runs on every PR (`--smoke`, 120
  facts, catastrophic-only p95 budget) and in full mode at 2k facts with a
  100 ms p95 gate. The MVP design target (p95 < 100 ms at 10k facts) is a
  workstation-profile target - validate it with the scale probe above, not
  with hermetic CI numbers.
- `benchmarks/cost` - assembled-prompt token cost regression gate (exact
  counts, fails the PR on >10% growth).

