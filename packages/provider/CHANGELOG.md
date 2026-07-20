# @graphorin/provider

## 0.13.8

### Patch Changes

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

- [#227](https://github.com/o-stepper/graphorin/pull/227) [`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac) Thanks [@o-stepper](https://github.com/o-stepper)! - Grammar-safe redaction now handles signed numeric JSON leaves (deep-retest 0.13.5 P2). Masking `{"card":-4111111111111111}` previously left the minus sign stranded before an unquoted mask (`{"card":-[REDACTED creditcard]}`), producing invalid JSON in all three layers. The new span-based helper `jsonSafeSpan` (exported from `@graphorin/observability/redaction/patterns`, with a local twin in the security guardrail) absorbs the leading sign into the replaced span and emits the quoted mask, so the document stays parseable; a prose minus (`refund -4111... issued`) is untouched. `jsonSafeMask` remains exported with its exact historical behaviour for span-fixed callers, and both docblocks now state the whole-text ambiguity: a text consisting solely of the match is indistinguishable from a single-value JSON document and gets the quoted form. The security `credit-card` pattern is also digit-anchored on both ends, so the match no longer swallows the separator after the PAN (the `[REDACTED:credit-card]` marker used to glue onto the following word). Shared regression corpora (signed leaves in objects / arrays / top level, mixed verifier outcomes) plus seeded JSON-preservation property tests now run in all three suites: any valid JSON document stays valid after redaction.

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

- [#220](https://github.com/o-stepper/graphorin/pull/220) [`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171) Thanks [@o-stepper](https://github.com/o-stepper)! - Masking a bare numeric JSON leaf now keeps the document parseable: when a redaction match occupies a JSON value position, the mask is emitted in double quotes (`{"card":4111111111111111}` becomes `{"card":"[REDACTED creditcard]"}`), in all three layers - the `withRedaction` provider middleware, the OTLP `RedactionValidator`, and the security `piiDetection` guardrail. Prose and string-leaf masking are unchanged. The helper is exported as `jsonSafeMask` from `@graphorin/observability/redaction/patterns`.

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/observability@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- [#215](https://github.com/o-stepper/graphorin/pull/215) [`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8) Thanks [@o-stepper](https://github.com/o-stepper)! - Redaction no longer corrupts serialized numbers. The `withRedaction` provider middleware now honours per-pattern `verify` predicates in both the request scrub and the streaming scan (previously only the OTLP validator did), the built-in `creditcard` pattern refuses decimal-adjacent digit runs and requires a major-network leading digit (2-6) on top of the Luhn checksum, and the security guardrail's `credit-card` and `us-phone` patterns gained the same boundary guards. Previously a `fact_search` score such as `0.01639344262295082` or an epoch-ms timestamp inside a JSON tool result came back as `[REDACTED creditcard]`, breaking the JSON. Real PANs are still masked.

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

- [#198](https://github.com/o-stepper/graphorin/pull/198) [`ca53c34`](https://github.com/o-stepper/graphorin/commit/ca53c34749c1a90268c659f87f57a58ae7d266ff) Thanks [@o-stepper](https://github.com/o-stepper)! - OpenAI-shaped adapters: a SCHEMA-LESS structured request no longer sends any `response_format`. The 0.10.2 fix replaced `json_object` with a permissive `strict: false` json_schema, but a billed live pass against the Anthropic OpenAI-compat endpoint showed it rejects that too (`response_format.json_schema.strict: Input should be True`), and `strict: true` requires a closed schema - so every permissive spelling 400s there. The universal contract is the agent's trailing JSON instruction plus the local `schema.parse` gate; explicit `outputType.jsonSchema` requests keep the strict `json_schema` mapping (live-verified green on the same endpoint with a closed schema).

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/observability@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/observability@0.12.0

## 0.11.0

### Minor Changes

- [#193](https://github.com/o-stepper/graphorin/pull/193) [`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31) Thanks [@o-stepper](https://github.com/o-stepper)! - Ollama server timings surfaced in events and traces (external audit 2026-07-16, item 8). The core `ProviderEvent` `finish` variant gains an optional `providerMetadata` field mirroring `ProviderResponse.providerMetadata` for the streaming path. The Ollama adapter normalizes the server's nanosecond timing fields into the new `OllamaTimings` shape (`totalMs` / `loadMs` / `promptEvalMs` / `evalMs`) and reports it under `providerMetadata.ollama` on both the streamed `finish` event and the `generate()` response, so model load, prompt processing and generation are finally distinguishable - a cold call dominated by `loadMs` no longer looks like slow generation. `withTracing` stamps numeric vendor diagnostics from `providerMetadata` onto the provider span as `graphorin.provider.<vendor>.<key>` attributes (bounded, numbers only). `DEFAULT_OLLAMA_BASE_URL` is now exported from the package barrel.

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/observability@0.11.0

## 0.10.2

### Patch Changes

- [#190](https://github.com/o-stepper/graphorin/pull/190) [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix structured output silently breaking over the Anthropic OpenAI-compat endpoint (e2e 2026-07-16, LIVE-EVAL-01, major). The openai-shaped adapter emitted `response_format: { type: 'json_object' }` for a structured request without an explicit JSON schema, but the Anthropic OpenAI-compat endpoint rejects it with HTTP 400 (`response_format.type: Input should be 'json_schema'`), so the memory standard-phase extraction over that path silently produced zero facts. A schema-less structured request now sends a permissive `json_schema` (`{ type: 'object', additionalProperties: true }`, `strict: false`) instead of `json_object`, which is accepted by OpenAI's lenient json_schema mode and by the compat endpoints; a request that carries an explicit schema is unchanged (strict json_schema). Offline regression test pins the wire shape; a live re-check against the Anthropic OpenAI-compat endpoint is recommended before publishing the W-059 benchmark run.

- Updated dependencies []:
  - @graphorin/core@0.10.2
  - @graphorin/observability@0.10.2

## 0.10.1

### Patch Changes

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `classifyModelTier` returning `undefined` for the gpt-4o family (e2e 2026-07-16, MODEL-FAL-01, minor). The `openai-mini` / `openai-nano` rules matched only a numeric version (`gpt-(\d|\d+\.\d+)-mini`), so the `o` in `gpt-4o-mini` stopped the match, and the balanced `openai-gpt` rule's `(?!.*(?:mini|nano))` lookahead excluded it too - leaving `gpt-4o-mini` (the id the routing docs use as their concrete example) unclassified. The patterns now allow an `o` version suffix, so `gpt-4o-mini` / `gpt-4.1-mini` classify as `fast` and `gpt-4o` stays `balanced`.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the tiktoken-backed token counters throwing on special-token sequences (e2e 2026-07-16, PROVIDER-CT-01, major). `js-tiktoken`'s `encode` defaults `disallowedSpecial` to `'all'` and throws when the input contains a special-token sequence such as `<|endoftext|>`. Because `createDefaultCounter` routes gpt-_, gemini-_, keyless claude-\*, and the Bedrock/Google proxies through `JsTiktokenCounter`, ordinary user or model text containing such a sequence crashed `count` / `countText` - and with them compaction and the token budget. The counter now encodes with `disallowedSpecial=[]`, treating any such sequence as ordinary text (its BPE pieces) instead of a forbidden special token. Regression test pins that counting text with an embedded `<|endoftext|>` does not throw.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `RunBudget.maxCostUsd` failing open with the documented wiring (e2e 2026-07-13, R-01 / AGENT-RU-01 / OBS-PRIC-03, major; confirmed live). `withCostTracking` computed a per-call cost but only surfaced it on the `onUsage` hook - it never stamped `usage.cost` onto the `finish` event the agent run loop accumulates, so `state.usage.cost` stayed undefined, `RunBudget.maxCostUsd` was never enforced, and the runtime warned the ceiling was UNENFORCED even though every call was priced. When a `priceLookup` is configured, the middleware now stamps the computed cost onto the returned usage (both the streamed `finish` event and the `generate()` result), so the run loop's `accumulateUsage` folds it into `state.usage.cost` and the cost ceiling enforces as documented. A provider-reported `usage.cost` (no `priceLookup`) is left untouched. New regression tests pin the stamping on both paths, with and without an `onUsage` hook.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the reasoning + local-adapter defects (e2e 2026-07-16, T3). REASONING-02 (major, privacy): the agent runtime resolved `reasoningContract: 'optional'` to `'pass-through-all'` instead of the documented conservative default `'strip'` (`REASONING_RETENTION_DEFAULTS.optional`), so chain-of-thought was persisted in the transcript and round-tripped to the next provider call by default; it now defaults to `'strip'` unless a caller opts in via an agent- or provider-level override. REASONING-01 (major): with `reasoningRetention` set to keep reasoning, the local-adapter message converters flattened reasoning content parts away with a misleading "multimodal" warning; they now round-trip onto the wire's reasoning slot (Ollama native `thinking`, OpenAI-compatible `reasoning_content`). OLLAMA-AD-01 (major): the native Ollama adapter reported `finishReason: 'stop'` on tool-call turns because Ollama's `/api/chat` sends `done_reason: 'stop'` alongside `tool_calls`; it now reports `'tool-calls'` (matching the OpenAI-compatible path) on both the stream and generate paths. OLLAMA-AD-02 (major): an aborted stream reported `'stop'` instead of `'aborted'` on both local adapters because the ndjson/SSE iterators end cleanly on abort and bypassed the in-loop check; a post-loop re-check now surfaces the honest `'aborted'` reason. (REASONING-03 was already fixed by the external-audit remediation.) Regression tests added for each.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/observability@0.10.1

## 0.10.0

### Minor Changes

- [#181](https://github.com/o-stepper/graphorin/pull/181) [`214c20f`](https://github.com/o-stepper/graphorin/commit/214c20f1b2dc7463b683a86f50bc6b10c11ca3f0) Thanks [@o-stepper](https://github.com/o-stepper)! - Ollama adapter operational controls (external audit 2026-07-16, P1-4/P1-5/P1-6). `ollamaAdapter` gains three options: `think` (`false | true | 'low' | 'medium' | 'high'`, mapped to Ollama's top-level `think` field - thinking-capable models like qwen3 think by default and can spend most of their latency in the hidden chain; a truthy value also defaults `capabilities.reasoning` to `true`), `numCtx` (sent as `options.num_ctx` on every request AND used as the default `capabilities.contextWindow`, so the server allocation, the declared capability, and the memory compaction budget stop being three silently different numbers), and `keepAlive` (Ollama's `keep_alive`). Streamed `message.thinking` chunks now surface as `reasoning-delta` provider events instead of being dropped. `toolChoice` handling is honest instead of silent: `'none'` is enforced by withholding the tool catalogue, `'auto'` passes through, and a forced choice (`'required'` / `{ tool }`) throws the new `ProviderToolChoiceUnsupportedError` - the native `/api/chat` API has no `tool_choice` field, so the old behaviour silently degraded a contract to a suggestion (the OpenAI-compatible adapter against `http://127.0.0.1:11434/v1` maps it properly). `ProviderRequest.providerOptions` with a nested `options` object now MERGES into the built options block instead of clobbering `temperature` / `num_predict` / `num_ctx`.

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/observability@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/observability@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Export `listMiddlewareKinds` from the package barrel (e2e 2026-07-11 minor finding): the `@stable`-documented chain walker existed in `src/middleware/compose.ts` but was omitted from the middleware barrel, so it never reached the built dist and `import { listMiddlewareKinds } from '@graphorin/provider'` failed while its siblings `getMiddlewareKind` and `providerHasMiddleware` worked. The function is now re-exported alongside them; a regression test pins the public surface and walks a composed `withTracing` + `withRetry` chain through the public import.

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/observability@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-024: thinking-block signatures now actually round-trip - the whole retention pipeline was dead because nothing captured them.

  `ProviderEvent` gains a `{type: 'reasoning-end', meta?: ReasoningContentMeta}` terminator (per-block, matching both AI SDK generations). The vercel adapter maps v4 `reasoning-signature`/`redacted-reasoning` chunks and v7 `reasoning-end` (`providerMetadata.anthropic.signature`/`.redactedData`) onto it; `reasoning-start` stays a no-op. The agent runtime flushes buffered deltas into per-block `ReasoningContent` parts carrying the meta (redacted blocks become meta-only parts), and the step assembles those parts instead of one meta-less collapse - adapters without block structure keep the collapsed fallback. Downstream, the already-shipped chain finally engages: `applyReasoningPolicy('pass-through-claude')` retains the signed parts and `toAssistantPart` emits `providerOptions.anthropic.signature`, so multi-step tool use with Anthropic extended thinking replays each block byte-equal (pinned end-to-end: the step-2 request carries both signatures of a two-block step-1). Known scope limit: the one-shot `generate()` path still returns no reasoning (`ProviderResponse` has no field for it). MIGRATION: external exhaustive switches over `ProviderEvent` need a case for `'reasoning-end'`; transcripts may now carry several reasoning parts per step instead of one.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-023: the vercel adapter's streaming errors join the canonical taxonomy; transient failures become retryable/fallback-eligible.

  The AI SDK never throws from `streamText()` synchronously - 429/500/529 arrive as in-band `{type:'error'}` chunks, which the adapter mapped to an inert `kind: 'unknown'` after an eagerly-emitted `stream-start`, so `withRetry` could never restart (PS-1), `withFallback` never switched, and the agent fallback chain treated the failure as ineligible: a transient 529 on a streaming step failed the whole run. Now: `stream-start` is deferred until the first REAL mapped event; an error chunk BEFORE any content THROWS a typed `ProviderHttpError` (status/errorKind/headers lifted from the chunk - pre-content 429/529 retry and fall back, with `retry-after` honoured); abort-shaped error chunks finish as `'aborted'` (never retried); a MID-stream error chunk yields a classified `ProviderErrorKind` (so the agent's per-step fallback acts on rate-limit/capacity) and the stream finishes with `finishReason: 'error'` instead of a synthetic `'stop'` with zero usage (PS-4 parity). BREAKING for consumers that relied on a yield-first error event for a first-chunk failure or on `stream-start` always preceding the throw.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-095: the local adapters can finally put images on the wire - and never drop multimodal content silently again. With `capabilities: { multimodal: true }`, `openAICompatibleAdapter` / `llamaCppServerAdapter` emit OpenAI `content` parts arrays (`image_url` with bytes as a data URI - default mime `image/png` - and `URL`s passed through as strings; the SERVER dereferences, the adapter never fetches), and `ollamaAdapter` fills the native per-message `images` array with raw base64 (URL images cannot be inlined on that path and are dropped loudly). Audio/file parts have no portable wire form on OpenAI-compatible servers and keep being dropped - now with a WARN. With default capabilities the wire stays byte-identical (flat string content), and dropping ANY non-text part triggers exactly one WARN per adapter instance naming the dropped kinds and pointing at `capabilities.multimodal`.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - `withRateLimit` gains an optional `tokensPerMinute` budget alongside RPM (W-145): for agentic workloads the binding provider limit is TPM, and a 150k-token compacted transcript used to occupy the same single slot as a 200-token reranker call. Each request now reserves its estimated token weight (default heuristic `ceil(textChars/4) + maxTokens`, or a pluggable `estimateTokens` - wire `createDefaultCounter` for provider-accurate weights) from a second bucket whose capacity is the full minute budget. Throw mode reports the max of the RPM/TPM waits in `retryAfterMs`; queue mode grants FIFO only when both dimensions fit, with over-budget weights clamped to the bucket capacity so a huge request degrades to "wait for a full bucket" instead of deadlocking the queue. Without the option, behaviour is byte-identical to the RPM-only limiter.

### Patch Changes

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

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

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Prompt-cache economics end-to-end (audit 2026-07-04 Wave C, cluster C1).

  - `Usage` gains `cachedReadTokens` / `cacheWriteTokens` (subsets of `promptTokens`), mapped by the vercel adapter (v7 `inputTokenDetails`; reasoning split kept exclusive of `completionTokens`) and the OpenAI-compatible adapter (`prompt_tokens_details.cached_tokens`); the fields flow through step/run aggregation, `usageByModel`, run-state (de)serialization and `withCostTracking` (new `cachedReadPerMtok`/`cacheWritePerMtok` lookup rates, full-input-rate fallback).
  - New opt-in `ProviderRequest.cachePolicy` / `AgentConfig.cachePolicy` (`{ breakpoints: 'auto', ttl? }`): the vercel adapter anchors Anthropic `cache_control` on the first and last conversation messages so the stable prefix is written once and read at the discounted rate every later step.
  - `ModelPrice` gains `cacheWriteUsdPerToken`; `calculateCost` bills cache writes; the bundled pricing snapshot is regenerated (2026-07-04) with current Anthropic 4.x / OpenAI gpt-5 + gpt-4.1 + o3/o4-mini / Gemini 2.5 families (legacy ids retained), `lookupPrice` resolves dated ids via a date-suffix fallback, and a new snapshot-coverage release gate cross-checks the model-tier classifier against the snapshot with an explicit known-unpriced allowlist (post-cutoff models report null cost + WARN instead of invented numbers).
  - Cache-friendly catalogue: handoff tools serialize BEFORE the growing promoted section (byte-stable prefix under `tool_search` promotions), and new `toolPromotion: 'run-boundary'` freezes the advertised catalogue for a whole run while still persisting discoveries.

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Tools/MCP alignment (audit 2026-07-04 Wave C, cluster C2).

  - Worked examples now fold into the model-facing tool description inside the adapters themselves (vercel, openai-shaped, ollama; idempotent with the `createProvider` fold), so raw-adapter setups get them too.
  - `searchDeferred` indexes name + description + tags + worked-example comments (BM25 and semantic legs), widening `tool_search` recall to the phrasing examples document.
  - tools-06: `sandbox_violation` and `rate_limited` are now actually produced - a non-ok `SandboxResult` keeps its structured kind (violation/memory-exceeded -> `sandbox_violation`, sandbox timeout -> `timeout`), and tool authors can throw the new `ToolRateLimitError` (with `retryAfterMs`) to surface `rate_limited` with a pacing hint.
  - SEP-1303 conformance suite: one test per producible `ToolErrorKind` pins that every failure returns as a model-visible outcome (never a protocol throw, batch never shrinks). Docs: MCP 2026-07-28 RC deprecation callout (sampling/roots/logging frozen; Tasks targets the extension shape).

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Trace-tree observability (audit 2026-07-04 Wave C, cluster C7; pairs periphery-04).

  The agent loop now emits the previously-declared `agent.run` span per run and `agent.step` spans per step (parented under the run); `tool.execute` parents under the current step via the new optional `RunContext.span`; a `withTracing`-wrapped provider parents under the step via the new `ProviderRequest.parentSpan` (a live handle like `signal`). Attributes align to the OTel GenAI semantic conventions (`gen_ai.operation.name`, `gen_ai.agent.id/name`, `gen_ai.tool.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens/output_tokens`), parent-based sampling finally has parents to follow, and observability.md documents the real tree plus the memory-tier-spans-not-yet-parented limitation.

### Patch Changes

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Provider adapters now match their real SDK / wire contracts (audit 2026-07-04 Wave B, cluster B1).

  - vercel adapter: Graphorin tools convert to the AI SDK's name-keyed record with `jsonSchema()`-shaped input schemas; assistant `toolCalls` become `tool-call` content parts, `ToolMessage`s become `tool-result` messages, system-role messages hoist into the `system` option, and `toolChoice` maps onto the SDK spelling. Tool loops now run against the real `ai` peer (previously every tool conversation failed SDK validation). A real-SDK contract test suite (dev-only `ai` dependency) pins the shapes.
  - Anthropic token counter posts Anthropic wire-shaped bodies (system hoist, `tool_use` / `tool_result` blocks, turn merging) instead of raw Graphorin messages that 400'd on any agent transcript; degradation to the tiktoken fallback now WARNs once.
  - HTTP errors carry a canonical `errorKind` (shared `classifyHttpStatus` mapper: 429 rate-limit, 401/403 unauthorized, 5xx transient/capacity, context-length body sniff) plus captured `retry-after` / `x-ratelimit-*` headers; `withFallback` / `withRetry` consult them, so a 429 on the primary finally fails over and honours server-provided delays.
  - llamacpp-node: the system prompt is no longer injected twice, per-request contexts/sequences are disposed after every stream (KV-cache leak), and aborted streams report `finishReason: 'aborted'`.
  - OpenAI-compatible streaming sends `stream_options: { include_usage: true }` so vLLM / Together / OpenAI report real usage; `openAICompatibleAdapter` gained the `capabilities` / `timeoutMs` options its siblings had.
  - `withCostTracking` bills separately-reported reasoning tokens at the output rate; classifiers recognise Bedrock cross-region ids (`us.anthropic.claude-...`) and the AI SDK's dotted provider ids.

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

Initial release. See the root `CHANGELOG.md` and the corresponding
changeset for the full list of features.
