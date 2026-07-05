# @graphorin/tools

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1
  - @graphorin/security@0.6.1

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

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Agent harness quality (audit 2026-07-04 Wave C, cluster C3).

  - Recoverable error envelope: `ToolError` gains `recoverable` + `recoveryHint` (retry_later / check_input / try_alternative / report_to_user), stamped from the kind at the executor's completion funnel and rendered to the model as a bracketed recovery line under the familiar `Error: <message>`.
  - Transparent bounded tool retry: `rate_limited` outcomes from pure/read-only tools (or tools with an `idempotencyKey`) silently re-execute with exponential backoff up to 3 total attempts (`ToolRateLimitError.retryAfterMs` wins); tune via executor `retry` / `AgentConfig.toolRetry`.
  - Verifier seam: `AgentConfig.verifiers` run deterministic checks on every terminal response, emit `verifier.result` events, feed failures back as a user message and continue up to `maxVerifierRounds` (default 1); throwing verifiers count as passed. Deliberately no evidence-free self-reflection step.
  - ACI: empty successful tool output renders as an explicit `(tool ran successfully with no output)` marker.
  - Deterministic replay: opt-in `recordProviderResponses` journals each step's raw model response onto `RunState.steps[].providerResponse`; new `createReplayProvider(state)` re-drives a run offline and fails loudly on divergence.

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Deterministic security adoptions (audit 2026-07-04 Wave C, cluster C6).

  - Derived-taint propagation: opt-in `dataFlowPolicy.derivedTaint: 'strict'` fires the paraphrase-robust `derived-untrusted-to-sink` flow for every model-driven sink call once untrusted content entered the run (CaMeL-style control-flow integrity); the agent also records each tainted step's assistant text as `llm-derived` spans so model-echoed phrasing trips the verbatim probe.
  - Taint into memory (cross-session MINJA leg): `ToolReturn` gains a widen-only `taint` override honoured through the executor record path; `fact_search` / `deep_recall` / `recall_episodes` attach it when any returned item is quarantined or foreign-provenance, re-arming the ledger at recall. `RunState.taintSummary` additionally carries one-way FNV-1a span-tile hashes (no plaintext), so a resumed run re-detects pre-suspend verbatim copies.
  - MCP pinning completed: `toTools({ pinStore })` records fingerprints on first use and REJECTS drift by default when a store is present (rug-pull defense; `onPinMismatch: 'warn'` downgrades); tool-description injection hits at registration are counted (`mcp.tool-description.injection-flagged.total`).
  - Signal-only heuristics + Unicode pre-pass: shared `normalizeForMatching` (NFKC + zero-width strip) applied in the guardrails injection catalogue and the memory quarantine heuristics; security.md repositions all pattern catalogues as best-effort signal, never a sole gate. `TaintLabel.sourceKind` widened to `string` for the new descriptive kinds.

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Trace-tree observability (audit 2026-07-04 Wave C, cluster C7; pairs periphery-04).

  The agent loop now emits the previously-declared `agent.run` span per run and `agent.step` spans per step (parented under the run); `tool.execute` parents under the current step via the new optional `RunContext.span`; a `withTracing`-wrapped provider parents under the step via the new `ProviderRequest.parentSpan` (a live handle like `signal`). Attributes align to the OTel GenAI semantic conventions (`gen_ai.operation.name`, `gen_ai.agent.id/name`, `gen_ai.tool.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens/output_tokens`), parent-based sampling finally has parents to follow, and observability.md documents the real tree plus the memory-tier-spans-not-yet-parented limitation.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Sub-agent isolation & orchestration primitives (audit 2026-07-04 Wave D, cluster D2).

  - Run-level `'read-only'` capability (single-writer constraint): `AgentConfig.capability` / `AgentCallOptions.capability` never advertise writer tools or handoffs and the executor deterministically blocks fabricated writer calls with the new `capability_blocked` `ToolErrorKind` (threaded through `executeBatch`/`executeOne`, HITL resume, and the code-mode bridge).
  - `toTool({ contextFold })` returns a compact distilled child-run outcome instead of raw output; `toTool({ propagateTaint })` (default on) carries the child's coarse taint flags across the fold as a widen-only `ToolReturn.taint` override (`sourceKind: 'sub-agent'`) that re-arms the parent's data-flow ledger.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (audit 2026-07-04 Wave D, cluster D4) - architectural, deterministic layers.

  - RFC-6962 Merkle transparency over the audit log (`@graphorin/security/audit`): tree head, inclusion + consistency proofs, and Ed25519-signed checkpoints, so anchoring a signed head out-of-band makes the trail tamper-resistant (a rewrite of a checkpointed prefix fails the consistency proof).
  - Operator trust root for skills: `verifySkillSignature`/`installSkillFrom{Npm,Git}` gain `trustRoot` - a valid signature from a key absent from the root returns `valid: false` reason `'untrusted-key'`.
  - Progent-style tool-argument policies + Rule-of-Two capability profiles (`@graphorin/security/policy`): `AgentConfig.toolPolicy` (forbid-before-allow, default-deny sensitive) + `ruleOfTwo` (drops a lethal-trifecta leg, forcing a read-only capability floor) enforced by a new `ExecutorOptions.argumentPolicy` hook (`capability_blocked`).
  - Code-mode sandbox blocklist parity (`bridged-source.ts`) blocks the process-escape modules (child_process/vm/worker_threads/cluster/inspector) via the ESM resolve hook + a CJS `Module._load` patch.

### Patch Changes

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Make durable HITL exactly-once and gate approvals on validated input (agent-02, tools-02, agent-07). With a `checkpointStore` wired, the resume now persists a write-ahead intent checkpoint before dispatching approved calls and the journaled post-dispatch state after - so a re-delivered resume from the latest checkpoint (or from `result.state` in the manual JSON flow) cannot double-fire a side effect; re-resuming a stale pre-execution snapshot stays bounded at one re-execution. The executor validates (and repairs) args BEFORE the approval flow, evaluates `needsApproval` on the validated input, and the approval record carries the post-repair args a human actually vets; the agent pre-screen mirrors this (schema-invalid gated calls fail fast as `invalid_input`, never reaching a human) and the resumed dispatch runs with repair disabled so nothing can rewrite an approved payload behind the grant. Partial approval directives now execute the granted calls and re-suspend with the remainder instead of silently discarding grants. The FAQ and agent-runtime guide are rewritten to state the real exactly-once contract.

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Enforce transcript well-formedness so no path emits provider-rejected message sequences (agent-01, tools-07, context-engine-01). The durable-HITL pre-screen now collects EVERY approval-gated call in a step (not just the first) and executes the non-gated remainder before suspending, so the persisted transcript never carries dangling `tool_use` ids; `executeBatch` synthesizes an `execution_failed` outcome instead of silently dropping a slot whose `executeOne` rejected (e.g. a throwing tracer); summarize-compaction snaps its boundary backward so the preserved window never starts with an orphan `tool` message. The agent mock-provider harness now asserts transcript well-formedness on every request by default.

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix critical tool-schema wire bug (tools-01): plain Zod schemas were never converted to JSON Schema, so OpenAI-shaped/Ollama/vercel providers received `{"_def":...}` internals as tool `parameters` and MCP tools serialized to `{}`. Adds a shared structural Zod v3/v4 to JSON Schema converter (`@graphorin/tools/schema`, no new dependencies) used by the agent's `toolToDefinition`, the code-mode signature projection, and `ToolSearchMatch`; MCP's `buildJsonSchemaValidator` now retains the source JSON Schema and exposes it via `toJSON()`. Unprojectable schemas degrade loudly (WARN + permissive `{}`) instead of shipping serialized validator internals.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Spill-handle producer taint now survives executor and process boundaries (audit 2026-07-04 Wave B, cluster B2; tools-03 / security-02 / agent-08).

  - The default spill writer persists a `<file>.meta.json` sidecar (mode 0600) recording `{producerTrustClass, source, sensitivity}` next to every artifact; `createFileResultReader` recovers it and reports the producer class (plus source/sensitivity) on the read outcome. An untrusted spill produced in one executor (code-mode's quiet executor) or a prior process can no longer launder to trusted through the `read_result` built-in: the executor re-applies the producer's sanitization policy and records dataflow provenance under the producer's class.
  - Producer taint is resolved BEFORE truncation, so a re-spill of a handle read persists the original producer's taint into the new artifact's sidecar, and a secret-produced body keeps its secret tier through re-spill (stays off disk).
  - The agent snapshots the coarse taint summary and the promoted-tool set on EVERY exit through the run finalizer, not just the approval suspend: aborted runs (resumable) and completed runs (re-entered as follow-ups) now rehydrate the enforce-mode sink gate and the discovered-tool catalogue.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - MCP correctness tail (audit 2026-07-04 Wave B, cluster B8).

  - mcp-skills-05: a `sampling/createMessage` carrying `tools` / `toolChoice` is rejected with an `McpError` (the 2025-11-25 MUST - the client does not declare `sampling.tools`; previously it silently answered as a plain completion). URL-mode elicitation is declined honestly instead of being surfaced as an empty form with the URL invisible.
  - mcp-skills-06: MCP resource handles are scoped to their originating server (`mcp:<serverId>:<uri>`); `createMcpResourceReader` consults ONLY the matching client, closing the cross-server confused-deputy hop where server A's link (or a prompt-injected model) fetched a resource from trusted server B. Bare URIs are refused unless `allowCrossServer: true` is opted in.
  - mcp-skills-07: server-supplied JSON-Schema `pattern`s are guarded before compilation - pattern/tested-string length caps plus a nested-quantifier heuristic (`(a+)+`-class) - so a malicious server can no longer stall the event loop with catastrophic backtracking; guarded-out patterns degrade to permissive like malformed ones.
  - mcp-skills-10: new `onTransportClose` / `onTransportError` callbacks (plus `mcp.transport.closed|error.total` counters and a WARN log) surface a dead stdio child / dropped HTTP session; previously a disconnect was observable only as protocol errors on later calls.
  - mcp-skills-11: new `MCPClient.readResourceContents(uri)` returns every content item; the single-content `readResource` convenience now WARNs + counts when it truncates a multi-content response.
  - mcp-skills-04 (adjusted): a same-source tool re-registration increments `tool.registry.same-source-replaced.total`, so two server instances colliding on one identity are observable churn instead of a silent swap.
  - mcp-skills-09 (F-10): the documented NESTED `metadata.graphorin` frontmatter form now actually resolves (flat dotted keys still win when both are present); skills.md fixes `sandboxTier` to `sandbox` and the `parseSlashCommand` output shape.
  - mcp-skills-08 (F-9): mcp-client.md rewritten to the real observability surface (counters, no `mcp.tool.invoke` span, no per-call audit rows), the real executor error mapping, and the `.`-namespaced `sideEffectClassByTool` keys; sampling-with-tools / tasks / icons documented as known-unsupported.

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/core@0.6.0
  - @graphorin/security@0.6.0
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

- Phase 07 - initial release. The `@graphorin/tools` package ships the
  typed `tool({...})` builder, the strategy-aware `ToolRegistry`, the
  `ToolExecutor` with parallel/sequential dispatch, the approval flow,
  the inbound prompt-injection sanitization layer, the four-strategy
  result truncation pipeline, the streaming-tool execution surface, and
  the built-in `tool_search` lookup tool. See the package `README.md`
  for the full surface inventory and the workspace changeset for the
  rollup release notes.
