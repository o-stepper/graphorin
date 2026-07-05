# @graphorin/evals

> Eval framework for the [Graphorin](https://github.com/o-stepper/graphorin)
> framework. Ships scorer libraries (code, LLM-judge, prebuilt rubrics),
> dataset loaders (JSONL / CSV / from-traces / iterable), reporters
> (terminal / markdown / JSON / JUnit / HTML), a parallel runner with
> bounded concurrency, and regression detection that compares the
> current run against a stored baseline.
>
> Project Graphorin · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.6.0 (optional sub-pack; the full orchestrator is
  decoupled from `@graphorin/observability` per RB-17 / DEC-152).

---

## Install

```bash
pnpm add @graphorin/evals
```

The package depends only on `@graphorin/core` and
`@graphorin/observability`; reporters / loaders are part of the same
bundle so consumers do not need additional installs.

---

## Quickstart

```ts
import {
  runEvals,
  loadJsonlDataset,
  exactMatch,
  renderTerminalReport,
  exitOnFailures,
} from '@graphorin/evals';

const dataset = await loadJsonlDataset('./fixtures/golden.jsonl');
const report = await runEvals({
  agent,                       // anything with `run(input)`
  dataset,
  scorers: [exactMatch({ caseInsensitive: true })],
  concurrency: 4,
});
console.log(renderTerminalReport(report));
exitOnFailures(report);
```

---

## Scorers

| Scorer family | Identifiers | Notes |
|---|---|---|
| `code/`     | `exactMatch`, `regexMatch`, `jsonPath`, `predicate` | Pure-code grading. No provider call.|
| `llm/`      | `llmJudge`                                          | LLM-as-judge. Default `gpt-4o-mini`-class judge with `temperature: 0`. |
| `prebuilt/` | `toxicityScorer`, `factualityScorer`, `helpfulnessScorer` | Wrap `llmJudge` with a project-tested rubric. |
| `trajectory/` | `correctToolSelected`, `argumentValidity`, `redundantCallDetection`, `recoveryAfterError`, `finalStateCorrect` | Pure-code, offline scorers over a `Trajectory` (the tool calls a harness made). Measure harness reliability - tool selection, argument validity, redundant work, error recovery, goal state. |

---

## Dataset loaders

| Loader | Use |
|---|---|
| `loadJsonlDataset(path)`                       | Read a JSONL file. Each line is a JSON object with `input` + optional `expected` / `id` / `metadata`.|
| `loadCsvDataset(path)`                         | Read a CSV file (RFC 4180 strict subset). Columns map by name.|
| `loadDatasetFromTraces(path, { extract })`     | Distil a dataset from the framework's replay log.|
| `fromIterable(cases)`                          | Wrap an in-memory array as a dataset (tests / ad-hoc data).|

---

## Reporters

| Reporter | Output | Best for |
|---|---|---|
| `renderTerminalReport(report)`  | Plain text (no ANSI). | CI logs, local dev. |
| `renderMarkdownReport(report)`  | Markdown.             | PR descriptions, doc sites. |
| `renderJsonReport(report)`      | Canonical JSON.       | Dashboards, regression checkers. |
| `renderJunitReport(report)`     | JUnit XML.            | GitHub Actions / GitLab / CircleCI. |
| `renderHtmlReport(report)`      | Self-contained HTML.  | Artifact viewers. |

---

## Parallel runner

```ts
const report = await runEvals({
  agent,
  dataset,
  scorers,
  iterations: 3,            // each case run 3 times for variance estimation
  concurrency: 8,           // up to 8 parallel agent.run() calls
  signal: controller.signal,
  onProgress: (e) => console.log(`${e.index}/${e.total} ${e.caseId}`),
});
```

---

## Regression detection

```ts
import { detectRegressions, exitOnFailures } from '@graphorin/evals';

const baseline = JSON.parse(await readFile('./baselines/golden.json', 'utf8'));
const report = await runEvals(...);
const regression = detectRegressions(report, baseline, {
  maxPassRateDropPct: 5,
  maxAvgScoreDrop: 0.05,
  maxAvgDurationIncreaseMs: 250,
});
if (regression.hasRegressions) {
  for (const f of regression.findings) {
    console.error(`regression - ${f.kind}: ${f.message}`);
  }
}
exitOnFailures(report, regression);
```

---

## Multi-format report writing

```ts
import { writeReports } from '@graphorin/evals';

await writeReports({
  report,
  outDir: './eval-out',
  formats: ['terminal', 'markdown', 'json', 'junit', 'html'],
  basename: 'golden',
});
```

---

## Related decisions

- DEC-152 - Eval split: keep evaluation interfaces in `@graphorin/observability`, ship the full eval framework as `@graphorin/evals`.

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
