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

   Pass a **dedicated judge** (`--judge-provider/--judge-model/--judge-base-url`
   or the `GRAPHORIN_BENCH_JUDGE_*` env vars; the judge key is env-only:
   `GRAPHORIN_BENCH_JUDGE_API_KEY`, falling back to `GRAPHORIN_BENCH_API_KEY`
   for single-endpoint setups) - the runner REFUSES to write a
   `--json` baseline from a self-judged real-provider run (evals-04; override
   with `--allow-self-judge` only for throwaway experiments). The
   `benchmark-longmemeval.yml` dispatch form exposes the judge as the
   `judge_provider`/`judge_model` inputs and fails fast when a real provider
   is selected without one. Add
   `--iterations 3` for a mean ± stddev pass rate instead of a point estimate
   (evals-05), and pick the config under test with `--retrieval
   default|multi-query|hyde|iterative|graph` and `--embedder none|fake`
   (evals-01/02) - every report stamps its `benchConfig`, so a hybrid run can
   never be confused with an FTS-only one.

3. **Strip the report before committing**: a real-provider report embeds
   every case's full `haystackSessions` (~0.5 MB per case, 16-83 MB per
   ability) - far past git sanity and biome's 1 MiB cap, and the
   regression gate reads none of it (`detectRegressions` needs
   `summary`, `results[].caseId`, `results[].scores`, durations).

   ```bash
   node benchmarks/longmemeval/scripts/strip-baseline.mjs \
     benchmarks/longmemeval/baselines/<loader>.<ability>.json
   ```

4. Review, then copy the emitted `reports/<loader>.<ability>.json` here as
   `<loader>.<ability>.json`, strip it, and commit it. Subsequent runs
   gate against it.

`reports/` holds ephemeral run output and is git-ignored; only the curated
(stripped) baselines in this directory are committed.

## Committed live baselines (2026-07-17)

The five `longmemeval.<ability>.json` files were seeded from a billed
real-provider run: subject `openai-compatible:claude-haiku-4-5` (the
Anthropic OpenAI-compat endpoint), judge `ollama:qwen3:8b-q4_K_M`
(think-off), `mode=memory retrieval=default embedder=none topK=12` -
each file's `benchConfig` records it. Headline pass rates:
info-extraction 118/150, multi-session 61/121, temporal 75/127,
knowledge-update 56/72, abstention 28/30 (abstention rate 96.7%);
338/500 (67.6%) overall.

## Full-context baseline (SOTA-1)

The memory pipeline is only meaningful next to the dumb baseline that inlines the
**whole** haystack. Run the same ability with `--mode full-context` against the
same real provider and compare accuracy *and* the `Tokens/query` line stamped in
each RESULTS header - on a small corpus full-context often wins on accuracy at a
much higher token cost, and that trade-off is the number to report:

```bash
node benchmarks/longmemeval/dist/runner.js \
  --provider ollama --model llama3.1 --mode full-context \
  --loader longmemeval --dataset benchmarks/.datasets/longmemeval_s.json \
  --variant S --ability temporal \
  --json benchmarks/longmemeval/reports/full-context.temporal.json
```

## Committed plumbing baseline

`longmemeval.fixture.stub.json` is the deterministic stub-provider run over the
checked-in 3-question fixture. It exists so the regression machinery itself is
exercised offline on every workflow dispatch (the "Fixture plumbing gate" step)
and locally via `tests/c8-honesty.test.ts` - it says nothing about memory
quality. Re-seed after intentional fixture/stub changes:

```bash
node benchmarks/longmemeval/dist/runner.js --provider stub \
  --json benchmarks/longmemeval/baselines/longmemeval.fixture.stub.json \
  --results /tmp/fixture-results.md
```
