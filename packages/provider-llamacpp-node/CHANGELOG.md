# @graphorin/provider-llamacpp-node

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1
  - @graphorin/provider@0.6.1

## 0.6.0

### Patch Changes

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Provider adapters now match their real SDK / wire contracts (audit 2026-07-04 Wave B, cluster B1).

  - vercel adapter: Graphorin tools convert to the AI SDK's name-keyed record with `jsonSchema()`-shaped input schemas; assistant `toolCalls` become `tool-call` content parts, `ToolMessage`s become `tool-result` messages, system-role messages hoist into the `system` option, and `toolChoice` maps onto the SDK spelling. Tool loops now run against the real `ai` peer (previously every tool conversation failed SDK validation). A real-SDK contract test suite (dev-only `ai` dependency) pins the shapes.
  - Anthropic token counter posts Anthropic wire-shaped bodies (system hoist, `tool_use` / `tool_result` blocks, turn merging) instead of raw Graphorin messages that 400'd on any agent transcript; degradation to the tiktoken fallback now WARNs once.
  - HTTP errors carry a canonical `errorKind` (shared `classifyHttpStatus` mapper: 429 rate-limit, 401/403 unauthorized, 5xx transient/capacity, context-length body sniff) plus captured `retry-after` / `x-ratelimit-*` headers; `withFallback` / `withRetry` consult them, so a 429 on the primary finally fails over and honours server-provided delays.
  - llamacpp-node: the system prompt is no longer injected twice, per-request contexts/sequences are disposed after every stream (KV-cache leak), and aborted streams report `finishReason: 'aborted'`.
  - OpenAI-compatible streaming sends `stream_options: { include_usage: true }` so vLLM / Together / OpenAI report real usage; `openAICompatibleAdapter` gained the `capabilities` / `timeoutMs` options its siblings had.
  - `withCostTracking` bills separately-reported reasoning tokens at the output rate; classifiers recognise Bedrock cross-region ids (`us.anthropic.claude-...`) and the AI SDK's dotted provider ids.

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627)]:
  - @graphorin/core@0.6.0
  - @graphorin/provider@0.6.0

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
