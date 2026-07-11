# @graphorin/pricing

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
