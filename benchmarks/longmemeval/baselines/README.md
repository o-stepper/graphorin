# LongMemEval baselines

Committed per-ability baseline reports the dispatch-only `LongMemEval benchmark`
CI job gates against (`detectRegressions`, tolerances: `maxPassRateDropPct: 5`,
`maxAvgScoreDrop: 0.05`).

## Naming

```
<loader>.<ability>.json     e.g. longmemeval.temporal.json, locomo.abstention.json
```

`<loader>` ∈ `longmemeval | locomo | dmr`; `<ability>` ∈ `info-extraction |
multi-session | temporal | knowledge-update | abstention`.

## Seeding / updating a baseline

1. Fetch the dataset: `node scripts/fetch-eval-datasets.mjs --only longmemeval`.
2. Run the ability with a **real** Provider wired into the runner (the default
   `main()` uses an offline stub whose scores are plumbing-only):

   ```bash
   node benchmarks/longmemeval/dist/runner.js \
     --loader longmemeval --dataset benchmarks/.datasets/longmemeval_s.json \
     --variant S --ability temporal \
     --json benchmarks/longmemeval/reports/longmemeval.temporal.json
   ```

3. Review, then copy the emitted `reports/<loader>.<ability>.json` here as
   `<loader>.<ability>.json` and commit it. Subsequent runs gate against it.

`reports/` holds ephemeral run output and is git-ignored; only the curated
baselines in this directory are committed.
