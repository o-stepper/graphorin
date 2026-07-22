---
'@graphorin/evals': minor
---

Benchmark evidence and honest uncertainty. The markdown and terminal reporters now render the Wilson 95% CI (and `pass^k` under repeats) the runner always computes, so a small-n run can never read as a confident result; the LLM judge persists its raw reply as `metadata.judgeText` beside the parsed score. The benchmark runners (private packages) additionally stamp `datasetPath` + `datasetSha256` and structured `subjectSpec`/`judgeSpec` model identities into `benchConfig`, generalize `--think` to effort levels, add `--num-ctx`, and bring the HaluMem runner to knob parity (`--think`, `--timeout-ms`).
