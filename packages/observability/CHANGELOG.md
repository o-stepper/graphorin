# @graphorin/observability

## 0.15.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.14.0

## 0.13.13

### Patch Changes

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P1: infrastructure failures can no longer exit a benchmark green. The eval runner's `agent.run threw:` reason prefix is now the exported stable `AGENT_RUN_THREW_MARKER`, and the LongMemEval runner classifies such cases (provider timeouts, HTTP errors) as `INFRASTRUCTURE_FAILED` and judge off-format exhaustion as `JUDGE_FAILED` - both force a non-zero exit even under `--gate-on regressions` (previously two 120s provider timeouts scored as ordinary misses and a baseline-less regressions-gated run exited 0). Recovered judge retries become visible telemetry: `llmJudge` stamps `judge-retries: N` (exported `JUDGE_RETRY_MARKER`) into the score reason and `metadata.judgeRetries`, and both benchmark runners report `judgeRetriedCases`. Eval case results now echo the dataset's reference answer (`EvalCaseResult.expected`) so persisted reports can be adjudicated without re-joining the dataset. Benchmark runner UX: `--think true|false` (subject-leg Ollama reasoning override), `--timeout-ms` (per-request adapter timeout), and a credentials preflight that accepts `OPENAI_API_KEY` for the official OpenAI endpoint and fails fast on a keyless official-endpoint run instead of burning every case as HTTP 401.

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P3: every package sitting between an application and a zod-peer package (`core`/`tools`/`memory`/`mcp`) now re-declares the `zod` peer as **optional** (`peerDependenciesMeta`), so strict Yarn PnP installs stop emitting `YN0086` "does not provide zod" warnings - the application root's zod instance flows through the intermediaries. npm/pnpm behaviour is unchanged (optional peers are not auto-installed; the underlying required peers still resolve exactly as before).

- Updated dependencies []:
  - @graphorin/core@0.13.13

## 0.13.12

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.12

## 0.13.11

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7

## 0.13.6

### Patch Changes

- [#227](https://github.com/o-stepper/graphorin/pull/227) [`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac) Thanks [@o-stepper](https://github.com/o-stepper)! - Grammar-safe redaction now handles signed numeric JSON leaves (deep-retest 0.13.5 P2). Masking `{"card":-4111111111111111}` previously left the minus sign stranded before an unquoted mask (`{"card":-[REDACTED creditcard]}`), producing invalid JSON in all three layers. The new span-based helper `jsonSafeSpan` (exported from `@graphorin/observability/redaction/patterns`, with a local twin in the security guardrail) absorbs the leading sign into the replaced span and emits the quoted mask, so the document stays parseable; a prose minus (`refund -4111... issued`) is untouched. `jsonSafeMask` remains exported with its exact historical behaviour for span-fixed callers, and both docblocks now state the whole-text ambiguity: a text consisting solely of the match is indistinguishable from a single-value JSON document and gets the quoted form. The security `credit-card` pattern is also digit-anchored on both ends, so the match no longer swallows the separator after the PAN (the `[REDACTED:credit-card]` marker used to glue onto the following word). Shared regression corpora (signed leaves in objects / arrays / top level, mixed verifier outcomes) plus seeded JSON-preservation property tests now run in all three suites: any valid JSON document stays valid after redaction.

- Updated dependencies []:
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5

## 0.13.4

### Patch Changes

- [#220](https://github.com/o-stepper/graphorin/pull/220) [`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171) Thanks [@o-stepper](https://github.com/o-stepper)! - Masking a bare numeric JSON leaf now keeps the document parseable: when a redaction match occupies a JSON value position, the mask is emitted in double quotes (`{"card":4111111111111111}` becomes `{"card":"[REDACTED creditcard]"}`), in all three layers - the `withRedaction` provider middleware, the OTLP `RedactionValidator`, and the security `piiDetection` guardrail. Prose and string-leaf masking are unchanged. The helper is exported as `jsonSafeMask` from `@graphorin/observability/redaction/patterns`.

- Updated dependencies []:
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- [#215](https://github.com/o-stepper/graphorin/pull/215) [`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8) Thanks [@o-stepper](https://github.com/o-stepper)! - Redaction no longer corrupts serialized numbers. The `withRedaction` provider middleware now honours per-pattern `verify` predicates in both the request scrub and the streaming scan (previously only the OTLP validator did), the built-in `creditcard` pattern refuses decimal-adjacent digit runs and requires a major-network leading digit (2-6) on top of the Luhn checksum, and the security guardrail's `credit-card` and `us-phone` patterns gained the same boundary guards. Previously a `fact_search` score such as `0.01639344262295082` or an epoch-ms timestamp inside a JSON tool result came back as `[REDACTED creditcard]`, breaking the JSON. Real PANs are still masked.

- Updated dependencies []:
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.2

## 0.10.1

### Patch Changes

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Export `toOtlpEnvelope` (e2e 2026-07-13, OBS-PRIC-01, minor). The observability and migration guides document `toOtlpEnvelope` as the exported helper for adapting Graphorin spans into an upstream OTel SDK pipeline, but it was marked `@internal` and re-exported from no public entry point, so it was unreachable. It is now a `@stable` export from `@graphorin/observability` (and the `./exporters` subpath).

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix opt-in redaction patterns being unenablable via `validation.enabledPatterns` (e2e 2026-07-13, OBS-PRIC-02, major). `enabledPatterns` is documented as a per-name allow-list, but it filtered over the default-on catalogue only (the 14 built-in patterns), and the opt-in patterns (`ipv4`, `ipv6`, `gcp-service-account`) are not in that set - so naming them was a silent no-op and, for example, IP addresses flowed to exporters unmasked despite being requested. When `enabledPatterns` is set (and no custom catalogue is supplied) the validator now selects from the full built-in catalogue so the opt-in patterns can be enabled by name; with no allow-list the default stays the 14 default-on patterns. Regression tests pin that `enabledPatterns: ['ipv4']` masks an IPv4 address and that ipv4 stays off by default.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix documented session replay reproducing nothing (e2e 2026-07-16, SESSION-R-01 / SESSION-R-02, major). Two problems combined so `session.replay()` (no arguments) emitted only `replay.start` / `replay.end`: (1) the `graphorin.session.id` attribute defaulted to the `internal` tier, so the default `public` export floor stripped it and `createSqliteSpanExporter` persisted spans with `session_id` NULL - un-keyed and unfindable; and (2) the sanitized replay floor defaulted to `public`, so every `internal`-tier framework span was skipped with reason `sensitivity`. The tracer now tags routing identifiers (`graphorin.session.id`, `graphorin.run.id`) as `public` so a span stays keyable under any export floor, and the default sanitized-replay floor is now `internal` so framework spans replay by default while secret-tier attributes stay excluded and secret/PII patterns are still masked. The observability guide's replay wiring now raises the export floor to `internal` (so the run's telemetry is persisted, not stripped) and documents the floor. Regression tests pin that routing ids survive the default exporter and that a default replay includes internal-tier spans.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(observability): ORPHAN-SU-01 map the insight tier + new consolidate phases to OpenInference kinds

  The OpenInference kind table silently omitted 8 `KnownSpanType`s added later:
  `memory.read/write/search.insight` (-> RETRIEVER) and the
  `memory.consolidate.reflect / learned-context / curated-block /
profile-projection / promotion` phases (-> CHAIN). They returned null from
  `openInferenceKindFor` and were not on the exclusion list, so their spans
  carried no `openinference.span.kind`. A new compile-time-exhaustive test pins
  that every `KnownSpanType` is mapped or explicitly excluded.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7)]:
  - @graphorin/core@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0

## 0.8.0

### Patch Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Make replay sensitivity decisions identical across trace sources (E-18, S-20/9): `serializableRecord` now serializes `sensitivityByAttribute` for spans and events, so the JSONL replay log no longer loses every per-attribute tier (previously `minSensitivity` was inert for JSONL-sourced replays and public-tagged attributes were over-stripped to `{}` on re-sanitization). Symmetrically, `sanitizeRecord`/`sanitizeEvents` now prune tier-map entries for attributes stripped at export, so map-preserving sources (SQLite span store, in-memory) no longer skip a whole already-sanitized span at replay because of a stale `secret` entry whose value never reached the sink. One span exported through both paths now yields byte-identical persisted tier maps and identical `skipBySensitivity` outcomes.

- Updated dependencies []:
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - New imperative pattern `untrusted-content-delimiter-injection` (W-030 defense-in-depth): fabricated `<<<untrusted_content` / `<<</untrusted_content` envelope delimiters inside untrusted content are now detected and stripped by the `detect-and-strip*` policies, giving an audit signal (`tool.inbound.sanitization.hit`) on envelope break-out attempts. The regex is scoped strictly to the envelope markers - bare `<<<` / `>>>` runs (Python doctest, shell heredoc) never match. Minor bump per the catalogue's stability rule: existing deployments may see new counter increments.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Per-type sampling rules now apply to CHILD spans under the default parent-based decision maker (W-090) - `{ type: 'tool.execute', rate: 0.01 }` finally thins the per-call spans inside sampled `agent.run` traces, where the volume actually lives, as the docstring always promised. Rules only ever downsample: children of an unsampled parent are never resurrected, and a child dropped by its rule propagates `parentSampled=false` to its own descendants (documented tree break). Operators whose previously-inert rules now take effect will see child-span export volume drop accordingly; configurations without rules are unchanged.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-092: `CostTracker` grows three capabilities for the long-running-assistant scenario. (1) Prompt-cache legs: `CostRecordInput` accepts `cachedReadTokens` / `cacheWriteTokens` (names mirror core `Usage`), and `CostSnapshot` + its byModel entries always carry both (0 when never recorded) so cache economics are visible per span/scope/model. (2) Bounded memory: internal maps are capped by default (`retention: { maxSpanEntries: 10_000, maxScopeEntries: 10_000 }`) with oldest-first (insertion-order) eviction, an `onEviction` observer, documented ZERO reads for evicted ids, and `retention: false` restoring the previous unbounded behaviour - the maps no longer grow for the process lifetime. (3) A shipped provider bridge: `costTrackerUsageDelegate(tracker, ids)` converts `withCostTracking`'s `onUsage` info (structurally - no provider import) into `record()` calls, carrying the cache legs and converting `costUsd` to a `Cost` (a zero cost records tokens without fabricating a $0 entry). Structural consumers of the exact `CostSnapshot` shape gain two required fields.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-094: span EVENT attributes can finally carry a sensitivity tier. `AISpan.addEvent` gains an optional third parameter (`{ sensitivity, sensitivityByAttribute }`, additive - existing implementations keep compiling), the tracer records it onto `SpanRecordEvent.sensitivityByAttribute`, and the validation exporter honours it instead of passing an empty map (which dropped EVERY event attribute under the default `'public'` floor). Out of the box, `recordException` now exports a `exception` event with a non-empty `exception.type` (the class name - safe and load-bearing for error dashboards) while `exception.message`/`exception.stacktrace` stay `'internal'`; `emitGenAIMessageEvents` marks role / `gen_ai.system` / message name / tool-call id `'public'` and keeps content `'internal'`. Untagged event attributes keep the default-deny behaviour, and `onViolation` now distinguishes event drops from span-attribute drops via `origin: 'event:<name>'`.

### Patch Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - OpenTelemetry peer ranges fixed (W-014): `@opentelemetry/sdk-node` and `@opentelemetry/exporter-trace-otlp-http` peers were caret-pinned to two DIFFERENT experimental 0.x minors (`^0.217.0` and `^0.215.0`) - on 0.x a caret pins the minor, otel requires version-matched experimental packages, and the current otel line satisfied neither pin, so following the observability guide ended in a hard `npm ERESOLVE`. Both peers are now the floor range `>=0.215.0 <1.0.0` (otel ships experimental minors monthly; a caret goes stale immediately and lockstep pin-bumping would require a release per otel minor), and the devDependencies moved to one current lockstep line (`^0.220.0`, tests green on it). `@opentelemetry/api ^1.9.0` (stable 1.x) is untouched. The pack gate's otel-freshness leg installs the packed tarball together with `@latest` of both packages, so future incompatibilities surface in CI before users hit them.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-091: the observability guide's wiring examples now compile and run - they use the package's own `createOTLPHttpExporter` (which implements the `TraceExporter` contract) instead of passing an `@opentelemetry/exporter-trace-otlp-http` class that does not (no `id`/`flush()`, different `export` signature). The GenAI attribute table now lists what `withTracing` actually emits (`gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens/output_tokens`); `gen_ai.request.temperature` and `gen_ai.completion.0.*` (emitted nowhere) are gone and the helper-only family (`emitGenAIAttributes`/`emitGenAIMessageEvents`, incl. `gen_ai.system`) is marked as such. The phantom `@opentelemetry/*` peer dependencies are removed - the package has zero `@opentelemetry` imports, so a consumer install no longer demands `@opentelemetry/api` it never uses (upstream OTel SDK pipelines adapt via the exported `toOtlpEnvelope`).

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0

## 0.6.1

### Patch Changes

- [#140](https://github.com/o-stepper/graphorin/pull/140) [`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the default-on `graphorin-token` redaction pattern: it was hardcoded to a stale `kru_(dev|test|prod)` token shape and never matched real framework tokens, which use the `gph` default prefix with `live|test|local` environment labels (`@graphorin/security` `DEFAULT_TOKEN_PREFIX`). The pattern now matches `gph_<env>_v1_<entropy>_<crc32>` with a loose env label (operators can extend `acceptEnvironments`); deployments that configure a custom token prefix must register their own pattern.

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - OTel GenAI alignment + honest eval statistics (audit 2026-07-04 Wave E, cluster E8).

  - Span names follow the GenAI semconv `{operation} {target}` shape when attributes carry the target (`chat <model>`, `execute_tool <tool>`, `invoke_agent <agent>`); the operation-mapping table and `GenAIOperationName` gain `invoke_agent` to match what the runtime actually emits; `agent.step` spans carry `gen_ai.agent.name`; pricing's `listMissingModels` reads the current `gen_ai.provider.name` attribute first (deprecated `gen_ai.system` kept as fallback).
  - New `@graphorin/evals` stats module: `mean`/`sampleStddev`, Wilson 95% interval, `passHatK` over `-iter-N` outcomes, and McNemar paired significance. `runEvals` summaries always carry `passRateCi` and (under `iterations > 1`) `passHatK`; `detectRegressions` annotates pass-rate-drop findings with the paired regressed/improved counts + p-value, and opt-in `requireSignificance` vetoes drops the paired test cannot distinguish from noise - the fixed tolerance alone was sample-size blind.

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627)]:
  - @graphorin/core@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

Initial release. See the workspace root `CHANGELOG.md` for the full
release notes; the per-package changelog is generated by Changesets
and tracks subsequent updates.
