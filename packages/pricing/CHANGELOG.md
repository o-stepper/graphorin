# @graphorin/pricing

## 0.13.9

### Patch Changes

- [#235](https://github.com/o-stepper/graphorin/pull/235) [`d7f335e`](https://github.com/o-stepper/graphorin/commit/d7f335e55e0cbc9cc81e064aae9130f8f559d689) Thanks [@o-stepper](https://github.com/o-stepper)! - Price the official undated OpenAI aliases and `-latest` ids (tenth deep retest P1). The bundled snapshot gains explicit rows for `gpt-4o`, `gpt-4o-mini`, `o1`, and `o3-mini` at their verified routing targets' rates plus input-billed `text-embedding-3-small`/`text-embedding-3-large` entries; `lookupPrice`/`priceLookupByModel` now strip dashed OpenAI date suffixes (`-2025-04-14`) alongside compact Anthropic ones and resolve `<family>-latest` to the family's dateless entry (or its single retained dated snapshot - two candidates stay null rather than guessing). Previously `priceLookupByModel({ modelId: 'gpt-4o-mini' })` returned `null`, so bench cost ceilings silently could not observe spend for one of the most common judge models.

- Updated dependencies []:
  - @graphorin/core@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8

## 0.13.7

### Patch Changes

- [#230](https://github.com/o-stepper/graphorin/pull/230) [`95db21e`](https://github.com/o-stepper/graphorin/commit/95db21e2103029d8e6f8a8f3e1790a2a3c7682e0) Thanks [@o-stepper](https://github.com/o-stepper)! - Deep-retest 0.13.6 remediation: the generic OpenAI-compatible adapter now works with both base-URL conventions and current OpenAI models, and the real-eval harnesses stop masking infrastructure defects.

  - `@graphorin/provider`: a `baseUrl` that already ends in `/v1` (the `api.openai.com/v1` / LM Studio / vLLM convention, and the exact providers-guide example) now gets `/chat/completions` appended instead of producing a guaranteed-404 `/v1/v1/chat/completions`; an explicit `chatPath` still wins verbatim. New `tokenLimitParam` option on `openAICompatibleAdapter` pins the wire name for `maxTokens` (`'max_tokens'` classic servers, `'max_completion_tokens'` current OpenAI models); left unset, the adapter reacts to the specific HTTP 400 naming `max_completion_tokens` by re-sending the request once with the remapped parameter and remembering the switch for the provider instance.
  - `@graphorin/pricing`: new `priceLookupByModel` - vendor-agnostic, model-id-keyed per-Mtok lookup over the bundled snapshot (with the dateless-alias fallback), drop-in for `withCostTracking({ priceLookup })`. Extracted from the LongMemEval runner so the HaluMem runner's `--max-cost-usd` ceiling actually observes spend instead of staying honestly-warned but unenforced.
  - `@graphorin/evals`: new `createFakeEmbedder` - the deterministic offline bag-of-words embedder moved out of the LongMemEval runner so every harness can arm the vector leg (`--embedder fake`); the HaluMem conflict A/B needs it because the reconcile mid-zone is an embedding-similarity band.

  Bench harness (not npm-published): HaluMem now checks the consolidator `PhaseOutcome` per session and stamps provider/ingest failures as `INFRASTRUCTURE_FAILED` (non-zero exit, `infrastructureFailedCases` in the JSON report) instead of scoring an empty memory as a quality zero; gains the `--embedder none|fake` axis; and its cost ceiling prices usage via the shared snapshot lookup.

- Updated dependencies []:
  - @graphorin/core@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5

## 0.13.4

### Patch Changes

- [#220](https://github.com/o-stepper/graphorin/pull/220) [`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171) Thanks [@o-stepper](https://github.com/o-stepper)! - Pricing provenance now carries the full chain: `PricingSnapshot` and `LookupPriceResult` gained an optional `upstreamSources` list naming the original pricing authorities (provider pricing pages, refresh datasets) alongside the existing `source` artifact link. The bundled snapshot declares the Anthropic and OpenAI pricing pages; `refreshPricing(...)` declares its fetch URL.

- Updated dependencies []:
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - GPT-5.6 pricing is now complete against the official OpenAI price page: the three snapshot entries carry the explicit `cacheWriteUsdPerToken` premium (1.25x input: $1.25 / $3.125 / $6.25 per 1M for luna / terra / sol), so cache-write tokens are no longer under-billed 20% via the input-rate fallback, and a fourth entry prices the bare `gpt-5.6` alias at sol rates (the API routes `gpt-5.6` to `gpt-5.6-sol`), so `lookupPrice`/`calculateCost`/the CLI no longer miss on the alias. A fixture test pins `calculateCost` to the official four-leg formula (base input + cached read + cache write + output).

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1

## 0.13.0

### Patch Changes

- [#206](https://github.com/o-stepper/graphorin/pull/206) [`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034) Thanks [@o-stepper](https://github.com/o-stepper)! - Add the GPT-5.6 family (gpt-5.6-luna, gpt-5.6-terra, gpt-5.6-sol) to the bundled pricing snapshot at the official standard short-context rates, and bump the snapshot date to 2026-07-19. Without these entries `lookupPrice` returned null for the current OpenAI line, so a `RunBudget.maxCostUsd` fed by these models could not observe spend (deep retest 2026-07-19, P1-3). Models released after the snapshot date still resolve to null + WARN by design - refresh via `refreshPricing(...)` or contribute the entry when pricing is public.

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

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(pricing): PROVIDER-01 bill cached reads at the input rate when the entry declares no cached-read price

  `calculateCost` silently billed `cachedReadTokens` at $0 whenever the snapshot
  entry lacked a `cachedReadUsdPerToken`. It now falls back to the full input rate
  (mirroring the documented cache-write leg), so cached reads are never
  under-billed to zero.

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

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Accept the published bare top-level array form of the genai-prices dataset (E-09, N-03/18): the live `data.json` from `pydantic/genai-prices` ships as a top-level ARRAY of provider objects, which `isGenaiPricesShape` rejected, so the documented `graphorin pricing refresh --url <data.json>` example failed (with the misleading native `missing provider / model` error in auto mode). Both `isGenaiPricesShape` and `convertGenaiPrices` now normalize `Array.isArray(body) ? { providers: body } : body` (elements must still carry `models` arrays, so native `ModelPrice[]` bodies keep taking the native path), and the shape-mismatch error names both accepted forms. Adds bare-array regression tests mirroring the live upstream shape.

- Updated dependencies []:
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-097: `graphorin pricing refresh` finally works against the dataset the docs point at. New pure converter (`convertGenaiPrices` / `isGenaiPricesShape`, exported) maps the published `@pydantic/genai-prices` dataset (providers[] -> models[] -> per-Mtok prices incl. cache read/write legs) into per-token `ModelPrice` entries; unrepresentable model entries (tiered/conditional pricing) are skipped with a counter instead of failing the refresh, and the supported subset is pinned by a vendored fixture + doc comment. `refreshPricing` gains `format: 'auto' | 'graphorin' | 'genai-prices'` (default auto: native first, then detection), stamps converted snapshots `version: 'genai-prices+converted'` with an additive `PricingSnapshot.conversion { format, skipped }`, and REJECTS a dataset declaring a non-USD currency instead of silently stamping dollars. The CLI adds `--format` and prints the skipped count; the pricing reference documents a working raw-URL example. Native-shape refreshes are byte-identical; no baked-in endpoint was added (privacy contract).

### Patch Changes

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-045: the `Cost.amount` units contract is now consistent across the ecosystem - and it is WHOLE currency units (for USD: dollars, fractional values expected), never "smallest fractional unit" / cents as the core TSDoc previously claimed. The canonical producer `calculateCost` (@graphorin/pricing), `CostTracker` snapshots (@graphorin/observability) and the memory consolidator's `costUsd` all already operated in dollars; a consumer that followed the old doc and divided by 100 was off by 100x. Docs-only for the code paths, with a numeric pin test (1M input tokens at $5/Mtok = exactly `5`) freezing the convention. If you implemented a minor-units conversion against the old wording, remove it.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Prompt-cache economics end-to-end (audit 2026-07-04 Wave C, cluster C1).

  - `Usage` gains `cachedReadTokens` / `cacheWriteTokens` (subsets of `promptTokens`), mapped by the vercel adapter (v7 `inputTokenDetails`; reasoning split kept exclusive of `completionTokens`) and the OpenAI-compatible adapter (`prompt_tokens_details.cached_tokens`); the fields flow through step/run aggregation, `usageByModel`, run-state (de)serialization and `withCostTracking` (new `cachedReadPerMtok`/`cacheWritePerMtok` lookup rates, full-input-rate fallback).
  - New opt-in `ProviderRequest.cachePolicy` / `AgentConfig.cachePolicy` (`{ breakpoints: 'auto', ttl? }`): the vercel adapter anchors Anthropic `cache_control` on the first and last conversation messages so the stable prefix is written once and read at the discounted rate every later step.
  - `ModelPrice` gains `cacheWriteUsdPerToken`; `calculateCost` bills cache writes; the bundled pricing snapshot is regenerated (2026-07-04) with current Anthropic 4.x / OpenAI gpt-5 + gpt-4.1 + o3/o4-mini / Gemini 2.5 families (legacy ids retained), `lookupPrice` resolves dated ids via a date-suffix fallback, and a new snapshot-coverage release gate cross-checks the model-tier classifier against the snapshot with an explicit known-unpriced allowlist (post-cutoff models report null cost + WARN instead of invented numbers).
  - Cache-friendly catalogue: handoff tools serialize BEFORE the growing promoted section (byte-stable prefix under `tool_search` promotions), and new `toolPromotion: 'run-boundary'` freezes the advertised catalogue for a whole run while still persisting discoveries.

### Patch Changes

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - OTel GenAI alignment + honest eval statistics (audit 2026-07-04 Wave E, cluster E8).

  - Span names follow the GenAI semconv `{operation} {target}` shape when attributes carry the target (`chat <model>`, `execute_tool <tool>`, `invoke_agent <agent>`); the operation-mapping table and `GenAIOperationName` gain `invoke_agent` to match what the runtime actually emits; `agent.step` spans carry `gen_ai.agent.name`; pricing's `listMissingModels` reads the current `gen_ai.provider.name` attribute first (deprecated `gen_ai.system` kept as fallback).
  - New `@graphorin/evals` stats module: `mean`/`sampleStddev`, Wilson 95% interval, `passHatK` over `-iter-N` outcomes, and McNemar paired significance. `runEvals` summaries always carry `passRateCi` and (under `iterations > 1`) `passHatK`; `detectRegressions` annotates pass-rate-drop findings with the paired regressed/improved counts + p-value, and opt-in `requireSignificance` vetoes drops the paired test cannot distinguish from noise - the fixed tolerance alone was sample-size blind.

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
