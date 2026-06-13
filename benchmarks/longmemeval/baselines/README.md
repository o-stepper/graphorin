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
2. Run the ability against a **real** Provider via `--provider` (the default
   `main()` uses an offline stub whose scores are plumbing-only). For a local
   Ollama model:

   ```bash
   node benchmarks/longmemeval/dist/runner.js \
     --provider ollama --model llama3.1 \
     --loader longmemeval --dataset benchmarks/.datasets/longmemeval_s.json \
     --variant S --ability temporal \
     --json benchmarks/longmemeval/reports/longmemeval.temporal.json
   ```

   `--provider` ∈ `stub (default) | ollama | llamacpp | openai-compatible`.
   `ollama`/`llamacpp` default to a loopback `--base-url`; cloud models use
   `--provider openai-compatible --model <id> --base-url <url>` with
   `GRAPHORIN_BENCH_API_KEY` in the environment (the equivalent
   `GRAPHORIN_BENCH_PROVIDER` / `_MODEL` / `_BASE_URL` env vars also work). The
   emitted RESULTS header records which provider produced the numbers, so a stub
   run can never be mistaken for a real baseline.

3. Review, then copy the emitted `reports/<loader>.<ability>.json` here as
   `<loader>.<ability>.json` and commit it. Subsequent runs gate against it.

`reports/` holds ephemeral run output and is git-ignored; only the curated
baselines in this directory are committed.

## Full-context baseline (SOTA-1)

The memory pipeline is only meaningful next to the dumb baseline that inlines the
**whole** haystack. Run the same ability with `--mode full-context` against the
same real provider and compare accuracy *and* the `Tokens/query` line stamped in
each RESULTS header — on a small corpus full-context often wins on accuracy at a
much higher token cost, and that trade-off is the number to report:

```bash
node benchmarks/longmemeval/dist/runner.js \
  --provider ollama --model llama3.1 --mode full-context \
  --loader longmemeval --dataset benchmarks/.datasets/longmemeval_s.json \
  --variant S --ability temporal \
  --json benchmarks/longmemeval/reports/full-context.temporal.json
```
