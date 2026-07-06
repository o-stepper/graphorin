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
   `pnpm --filter @graphorin/benchmark-longmemeval run bench -- --provider <spec> --judge-provider <other-spec> --iterations 3 --report-json <file>`
3. Drop the JSON here as `<loader>.<ability|suite>.<config>.json`
   (e.g. `longmemeval.full.default.json`,
   `longmemeval.full.hyde.json` for the ablation matrix).
4. Regenerate the page:
   `node documentation/scripts/build-benchmark-results.mjs --update`
   and commit both the JSON and `documentation/guide/benchmarks.md`.
5. Replace `longmemeval.plumbing-fixture.json` with real reports once
   the first real run lands - the fixture exists only so the page and
   its gate are wired end to end.
