# @graphorin/protocol

## 0.13.8

## 0.13.7

## 0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

## 0.13.4

## 0.13.3

## 0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

## 0.13.0

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.2

## 0.10.1

### Patch Changes

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `ServerMessageSchema` accepting an RPC response frame with neither `result` nor `error` (e2e 2026-07-13, CORE-PRO-01, minor). `result: z.unknown()` makes the key optional in zod, so a frame carrying only `{ v, jsonrpc, id }` validated as a success even though JSON-RPC 2.0 requires exactly one of result/error. The success schema now requires the `result` key to be present (any value, including `null`), so a result-and-error-less frame fails validation. Regression tests pin the rejection and that an explicit-null result still validates as a success.

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

### Patch Changes

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-109: the package doc no longer promises forward-compatible negotiation that does not exist. It now states the actual contract: the frame ENVELOPE (kind set, control-frame fields, the `v: '1'` literal) is validated strictly on both sides and evolves only lockstep (the 0.x deployment model; `v: '2'` frames are rejected), while the deliberate additive extension points live inside the envelope (event `type` + `payload: z.unknown()`, RPC `result: z.unknown()`, the `initialize` capabilities record - which the shipped client currently does not consume). New contract tests pin both classes of behaviour: unknown event types and arbitrary payload/result values pass; extra envelope fields, unknown kinds and `v: '2'` fail. No schema or wire behaviour changed.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-046: JSON-safe `WireAgentEvent` projection for all binary-bearing event variants, applied on the server WS path.

  `@graphorin/core` gains `WireFileGeneratedEvent`, `WireToolExecutePartialEvent`, `WireAgentEndEvent` (whose `result.state` is the `WireRunState` projection) plus the `WireAgentEvent` union and pure `toWireAgentEvent`/`fromWireAgentEvent` codecs. The `AgentEvent` TSDoc now documents the real two-layer wire contract (envelope `{eventId, subject, type, payload}` with `payload = WireAgentEvent`) instead of the false claim that `@graphorin/protocol` re-exports the union; protocol stays zod-only with a doc pointer. The server's `backgroundStreamAgent` projects every streamed event before emitting, so `file.generated`, binary `tool.execute.partial` chunks and a multimodal `agent.end` state arrive at WS clients decodable instead of as numeric-key mush. An exhaustive `Record<AgentEvent['type'], ...>` fixture gate in core forces a wire decision for every future event variant.

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

## 0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial Phase 14b release: Zod schemas + TypeScript types for the
  `graphorin.protocol.v1` WebSocket subprotocol - the discriminated
  unions `ClientMessage` and `ServerMessage`, the JSON-RPC-shaped
  control channel (`initialize` / `subscription.subscribe` /
  `subscription.unsubscribe` / `run.cancel` / `ping`), the typed
  push event frames, the asynchronous server-error frames, the
  subprotocol negotiation helpers, and the close-code taxonomy.
  Browser-friendly: zero Node-only dependencies; only `zod` at
  runtime. Created and maintained by Oleksiy Stepurenko.
