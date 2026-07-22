# benchmark-locomo-multilingual

**Graphorin** v0.13.12 · MIT License · © 2026 Oleksiy Stepurenko · https://github.com/o-stepper/graphorin

This package holds **optional locale-specific question files** for the memory-retrieval QA benchmark runner (`@graphorin/benchmark-memory-smoke`). The runner loads `questions.jsonl` from a locale directory when invoked with `--subset <locale>`.

## Layout

Per-locale folders may be added under this directory (for example `ru/`, `es/`, `zh/`). Each folder should contain:

- `questions.jsonl` - same schema as the bundled seed: `{ "id"?, "facts": string[], "question": string, "expected": string }` per line.

## Contributing a locale pack

1. Translate the benchmark prompts and expected answers while keeping `expected` as a short substring that must appear in retrieved fact text.
2. Validate locally: `pnpm install && pnpm --filter @graphorin/benchmark-memory-smoke build && node ./benchmarks/memory-smoke/dist/runner.js --subset <locale>`.
3. Open a pull request with translation provenance (reviewers, source language).

Community-maintained packs ship **after** the v0.6.0 tag; the hooks and procedure above are stable from v0.6.0 onward.

---

**Graphorin** · v0.13.12 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
