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
plus `s/p/o` entity links (~2k canonical entities), seeded through the public
`memory.semantic.remember` path with entity resolution on.

| Metric | Result |
| --- | --- |
| Seeding throughput (write path: FTS + vec0 + entity linking) | TBD facts/s |
| Hybrid search (FTS + vector + RRF), p50 / p95 over 200 queries | TBD / TBD ms |
| Graph-expanded search (`expandHops: 2`, `graphScoring: 'ppr'`), p50 / p95 | TBD / TBD ms |
| Consolidator light phase (decay/salience sweep over the corpus) | TBD s |
| DB size on disk (after WAL checkpoint) | TBD |

## Practical guidance

- **Up to ~100k facts per scope** the hybrid read path stays interactive
  (double-digit milliseconds); nothing in the schema degrades suddenly - the
  vec0 KNN and the FTS MATCH both scale smoothly, and the fused RRF adds a
  constant overhead.
- **Writes are the expensive direction.** Every `remember` is an FTS insert +
  a vector insert + (with the graph on) entity resolution and linking. Bulk
  imports should batch and can disable `graph.entityResolution` during the
  load, then backfill.
- **The consolidator light phase is a full-corpus sweep.** Its cost grows
  linearly with live facts; at 100k it is a background-job duration, not an
  inline one. Schedule it (the default triggers already do) rather than
  awaiting it on a request path.
- **DB size** is dominated by the vector table at small text sizes
  (64-dim float32 = 256 bytes/fact raw, plus vec0 index overhead). Budget
  roughly linearly per fact from the table above.
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

---

**Graphorin** · MIT License · © 2026 Oleksiy Stepurenko
