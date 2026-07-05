# @graphorin/provider

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
