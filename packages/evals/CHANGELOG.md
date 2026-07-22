# @graphorin/evals

## 0.15.0

### Minor Changes

- [#249](https://github.com/o-stepper/graphorin/pull/249) [`f28d394`](https://github.com/o-stepper/graphorin/commit/f28d3947598c71c43dd0a3f5327fbe0f277ced3a) Thanks [@o-stepper](https://github.com/o-stepper)! - Benchmark evidence and honest uncertainty. The markdown and terminal reporters now render the Wilson 95% CI (and `pass^k` under repeats) the runner always computes, so a small-n run can never read as a confident result; the LLM judge persists its raw reply as `metadata.judgeText` beside the parsed score. The benchmark runners (private packages) additionally stamp `datasetPath` + `datasetSha256` and structured `subjectSpec`/`judgeSpec` model identities into `benchConfig`, generalize `--think` to effort levels, add `--num-ctx`, and bring the HaluMem runner to knob parity (`--think`, `--timeout-ms`).

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.15.0
  - @graphorin/observability@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.14.0
  - @graphorin/observability@0.14.0

## 0.13.13

### Patch Changes

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P1: infrastructure failures can no longer exit a benchmark green. The eval runner's `agent.run threw:` reason prefix is now the exported stable `AGENT_RUN_THREW_MARKER`, and the LongMemEval runner classifies such cases (provider timeouts, HTTP errors) as `INFRASTRUCTURE_FAILED` and judge off-format exhaustion as `JUDGE_FAILED` - both force a non-zero exit even under `--gate-on regressions` (previously two 120s provider timeouts scored as ordinary misses and a baseline-less regressions-gated run exited 0). Recovered judge retries become visible telemetry: `llmJudge` stamps `judge-retries: N` (exported `JUDGE_RETRY_MARKER`) into the score reason and `metadata.judgeRetries`, and both benchmark runners report `judgeRetriedCases`. Eval case results now echo the dataset's reference answer (`EvalCaseResult.expected`) so persisted reports can be adjudicated without re-joining the dataset. Benchmark runner UX: `--think true|false` (subject-leg Ollama reasoning override), `--timeout-ms` (per-request adapter timeout), and a credentials preflight that accepts `OPENAI_API_KEY` for the official OpenAI endpoint and fails fast on a keyless official-endpoint run instead of burning every case as HTTP 401.

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P3: every package sitting between an application and a zod-peer package (`core`/`tools`/`memory`/`mcp`) now re-declares the `zod` peer as **optional** (`peerDependenciesMeta`), so strict Yarn PnP installs stop emitting `YN0086` "does not provide zod" warnings - the application root's zod instance flows through the intermediaries. npm/pnpm behaviour is unchanged (optional peers are not auto-installed; the underlying required peers still resolve exactly as before).

- Updated dependencies [[`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab), [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab)]:
  - @graphorin/observability@0.13.13
  - @graphorin/core@0.13.13

## 0.13.12

### Patch Changes

- [#242](https://github.com/o-stepper/graphorin/pull/242) [`8a85b51`](https://github.com/o-stepper/graphorin/commit/8a85b51f91fefab5f5432d49a69c5a54642126d8) Thanks [@o-stepper](https://github.com/o-stepper)! - `llmJudge` retries a missing `SCORE: <n>` marker once with a constrained reprompt (thirteenth deep retest, P3). Reasoning-model judges can burn a tight `maxOutputTokens` on hidden reasoning and return an empty visible reply - observed live with a Luna judge on the HaluMem QA smoke. The retry re-sends the conversation with an explicit marker-only instruction and a raised output budget (`max(32, 2 x maxOutputTokens)`); `offFormatRetries: 0` restores single-shot fail-loud. When retries are exhausted the scorer now throws the typed `JudgeOffFormatError` carrying the stable `judge-off-format:` marker, so benchmark reports can classify "the judge failed to grade" separately from "the subject answered badly" - the HaluMem runner prints those cases as `status=JUDGE_FAILED` (still a non-zero exit) and stamps `benchConfig.judgeOffFormatCases`.

- Updated dependencies []:
  - @graphorin/core@0.13.12
  - @graphorin/observability@0.13.12

## 0.13.11

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.11
  - @graphorin/observability@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.10
  - @graphorin/observability@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9
  - @graphorin/observability@0.13.9

## 0.13.8

### Patch Changes

- [#233](https://github.com/o-stepper/graphorin/pull/233) [`82f332f`](https://github.com/o-stepper/graphorin/commit/82f332fa4c6ea4dc47436dc52e8a00f5a7415238) Thanks [@o-stepper](https://github.com/o-stepper)! - Operation-level memory scorers no longer punish verbose-but-correct memories: the default matcher is now token-set F1 OR directional gold-content coverage (function words stripped from the gold side; new `goldTokenCoverage` / `goldCoverageMatcher` / `defaultMemoryPointMatcher` exports plus a `minGoldCoverage` option on the extraction and update scorers). Previously a semantically correct memory (gold `User is pescatarian` vs `The user started eating fish again ... identifies as pescatarian.`, token F1 0.235) was scored missed + hallucinated + omitted at once, deflating extraction recall/precision and the update-omission A/B on small operation benchmarks. Expect extraction and update numbers to shift on existing reports; supply a custom `matcher` to keep the old symmetric-F1-only behaviour.

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/observability@0.13.8

## 0.13.7

### Patch Changes

- [#230](https://github.com/o-stepper/graphorin/pull/230) [`95db21e`](https://github.com/o-stepper/graphorin/commit/95db21e2103029d8e6f8a8f3e1790a2a3c7682e0) Thanks [@o-stepper](https://github.com/o-stepper)! - Deep-retest 0.13.6 remediation: the generic OpenAI-compatible adapter now works with both base-URL conventions and current OpenAI models, and the real-eval harnesses stop masking infrastructure defects.

  - `@graphorin/provider`: a `baseUrl` that already ends in `/v1` (the `api.openai.com/v1` / LM Studio / vLLM convention, and the exact providers-guide example) now gets `/chat/completions` appended instead of producing a guaranteed-404 `/v1/v1/chat/completions`; an explicit `chatPath` still wins verbatim. New `tokenLimitParam` option on `openAICompatibleAdapter` pins the wire name for `maxTokens` (`'max_tokens'` classic servers, `'max_completion_tokens'` current OpenAI models); left unset, the adapter reacts to the specific HTTP 400 naming `max_completion_tokens` by re-sending the request once with the remapped parameter and remembering the switch for the provider instance.
  - `@graphorin/pricing`: new `priceLookupByModel` - vendor-agnostic, model-id-keyed per-Mtok lookup over the bundled snapshot (with the dateless-alias fallback), drop-in for `withCostTracking({ priceLookup })`. Extracted from the LongMemEval runner so the HaluMem runner's `--max-cost-usd` ceiling actually observes spend instead of staying honestly-warned but unenforced.
  - `@graphorin/evals`: new `createFakeEmbedder` - the deterministic offline bag-of-words embedder moved out of the LongMemEval runner so every harness can arm the vector leg (`--embedder fake`); the HaluMem conflict A/B needs it because the reconcile mid-zone is an embedding-similarity band.

  Bench harness (not npm-published): HaluMem now checks the consolidator `PhaseOutcome` per session and stamps provider/ingest failures as `INFRASTRUCTURE_FAILED` (non-zero exit, `infrastructureFailedCases` in the JSON report) instead of scoring an empty memory as a quality zero; gains the `--embedder none|fake` axis; and its cost ceiling prices usage via the shared snapshot lookup.

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/observability@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/observability@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/observability@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/observability@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/observability@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/observability@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/observability@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.0
  - @graphorin/observability@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/observability@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/observability@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/observability@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.2
  - @graphorin/observability@0.10.2

## 0.10.1

### Patch Changes

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(evals): EVALS-REP-01 make the regression boundary exclusive and float-robust

  `detectRegressions` compared drops against their tolerances with a strict `>` on
  raw floats, so a drop that lands exactly on the tolerance (e.g. a 5.00pp drop
  that `(1 - 0.95) * 100` computes as `5.000000000000004`) flipped to a spurious
  regression. The boundary is now consistently exclusive with a small epsilon
  guard across all three gates (pass-rate, avg-score, duration), and the
  `RegressionOptions` docstrings describe the max-tolerated-drop (exclusive)
  contract that the module doc and guide already stated.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/observability@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/observability@0.10.0

## 0.9.0

### Minor Changes

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Operation-level memory eval metrics (wave-D D1, plan item 4). `@graphorin/evals` gains the HaluMem-format loader (`loadHaluMemDataset` / `parseHaluMem`, stage `'operations' | 'qa'`, user-supplied local JSON per DEC-154) over new type-only operation contracts (`MemoryGoldPoint`, `MemoryOperationsEvalInput`, `MemoryOperationsObservation`), plus the staged `scorers/memory` family: deterministic `memoryExtractionRecall` / `memoryExtractionPrecision` / `memoryUpdateOmission` (token-F1 matching with a proximity tie-break for update pairs; custom matchers supported) and the judged `memoryQaHallucination` (llmJudge-based, EB-7-hardened). The store side adds `SemanticMemoryStoreExt.listActive` (recall-eligible enumeration with optional `excludePendingSupersede`) - shared groundwork for the D2 projection and the new `benchmarks/halumem` suite, whose `--conflict-pipeline on|off` axis is the update-omission value proof for the conflict pipeline; the longmemeval runner gains the same switch (replacing the historic hardcoded `off`) plus a `--max-cost-usd` run-level ceiling composed from `withCostLimit` + `withCostTracking`.

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/observability@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Make parallel eval runs work with framework agents (E-19 / S-21): `runEvals` gains an `agentFactory` option, invoked once per worker (with the worker index) so each worker drives its own agent instance - the supported way to run a Graphorin `Agent` (one run in flight per instance) at `concurrency > 1`. `agent` is now optional and stays for objects that tolerate overlapping `run()` calls; `agentFactory` wins when both are set, and passing neither is a `TypeError`. When a shared instance still trips the agent's concurrent-run guard, the runner now fails fast with a new exported `EvalConcurrencyError` naming the remedy (original error preserved as `cause`) instead of recording every remaining case as a generic `agent.run threw` scorer failure. The README quickstart and the evals guide, which previously steered users into the guard (shared `agent` + `concurrency: 4`), now document the single-run constraint and the `agentFactory` pattern.

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/observability@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - LOCOMO loader fidelity (W-022): `MemoryEvalTurn` gains an optional `speaker` field carrying the dataset-native speaker NAME alongside the two-role mapping - most LOCOMO questions reference speakers by name, and the LongMemEval benchmark runner now renders `<speaker>: ...` in both the full-context prompt and the ingested memory text. Numeric LOCOMO reference answers (e.g. `2022` - 6 of the 1986 QA pairs) are stringified instead of silently collapsing to `expected: ''`; QA pairs with no reference answer at all are SKIPPED rather than emitted, so the LLM judge never grades against an empty reference (documented in the module docs; this reduces the case count for such pairs). Any locally seeded LOCOMO baselines should be re-seeded - the ingested text changed; the committed stub-fixture CI baseline is unaffected.

### Patch Changes

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/observability@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - OTel GenAI alignment + honest eval statistics (audit 2026-07-04 Wave E, cluster E8).

  - Span names follow the GenAI semconv `{operation} {target}` shape when attributes carry the target (`chat <model>`, `execute_tool <tool>`, `invoke_agent <agent>`); the operation-mapping table and `GenAIOperationName` gain `invoke_agent` to match what the runtime actually emits; `agent.step` spans carry `gen_ai.agent.name`; pricing's `listMissingModels` reads the current `gen_ai.provider.name` attribute first (deprecated `gen_ai.system` kept as fallback).
  - New `@graphorin/evals` stats module: `mean`/`sampleStddev`, Wilson 95% interval, `passHatK` over `-iter-N` outcomes, and McNemar paired significance. `runEvals` summaries always carry `passRateCi` and (under `iterations > 1`) `passHatK`; `detectRegressions` annotates pass-rate-drop findings with the paired regressed/improved counts + p-value, and opt-in `requireSignificance` vetoes drops the paired test cannot distinguish from noise - the fixed tolerance alone was sample-size blind.

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/core@0.6.0
  - @graphorin/observability@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the eval framework for the Graphorin framework.
  Ships scorer libraries, dataset loaders (JSONL/CSV/from-traces),
  reporters (terminal/markdown/JSON/JUnit), parallel runner with
  regression detection, and CLI integration helpers.
