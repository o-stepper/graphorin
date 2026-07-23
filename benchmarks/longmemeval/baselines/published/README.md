# Published memory-benchmark reports

Every JSON report in this directory is rendered into the public
[Benchmarks](https://docs.graphorin.com/guide/benchmarks) page by
`documentation/scripts/build-benchmark-results.mjs`; the docs CI
regenerates the page and fails on drift, so the page can never say
something these artifacts do not.

Reports are benchConfig-stamped harness output (`RunReport` shape of
`benchmarks/longmemeval`). A report whose `benchConfig.provider` or
`benchConfig.judge` is `stub (plumbing-only)` renders with a
plumbing-only banner and its numbers are explicitly NOT quality
results.

## Publishing a real run (maintainer-gated: costs money)

1. `node scripts/fetch-eval-datasets.mjs --only longmemeval`
2. Run the ability suites with a REAL provider and a NON-SELF judge,
   at least 3 iterations, e.g.
   `pnpm --filter @graphorin/benchmark-longmemeval run start -- --provider <spec> --model <id> --judge-provider <other-spec> --judge-model <id> --iterations 3 --json <file>`
   (add `--max-cost-usd <n>` for a run-level spend ceiling).
3. Drop the JSON here as `<loader>.<ability|suite>.<config>.json`
   (e.g. `longmemeval.full.default.json`,
   `longmemeval.full.hyde.json` for the ablation matrix; the D1
   conflict-pipeline ablation drops as
   `longmemeval.full.conflict-on.json` from `--conflict-pipeline on`,
   and the operation-level A/B from `benchmarks/halumem` as
   `halumem.operations.conflict-<on|off>.json`).
4. Regenerate the page:
   `node documentation/scripts/build-benchmark-results.mjs --update`
   and commit both the JSON and `documentation/guide/benchmarks.md`.
5. The plumbing fixture (`longmemeval.plumbing-fixture.json`) was
   removed when the first real runs landed (2026-07-23: the OpenAI
   subject/mode matrix - three memory-mode models x3 iterations plus
   the gpt-5-mini full-context SOTA-1 arm, judge `ollama:qwen3:8b-q4_K_M`
   for comparability with the committed per-ability baselines - and the
   HaluMem conflict A/B pair). Long-run practicalities their execution
   taught, wired into the runner: `--concurrency`, `--max-output-tokens`
   (reasoning-default models answer empty inside a 256-token budget),
   `--subject-tpm` (client-side token-bucket pacing below the org's
   per-model TPM allowance - the retry ladder alone cannot pace
   sustained oversubscription).
