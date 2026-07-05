# @graphorin/core

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Prompt-cache economics end-to-end (audit 2026-07-04 Wave C, cluster C1).

  - `Usage` gains `cachedReadTokens` / `cacheWriteTokens` (subsets of `promptTokens`), mapped by the vercel adapter (v7 `inputTokenDetails`; reasoning split kept exclusive of `completionTokens`) and the OpenAI-compatible adapter (`prompt_tokens_details.cached_tokens`); the fields flow through step/run aggregation, `usageByModel`, run-state (de)serialization and `withCostTracking` (new `cachedReadPerMtok`/`cacheWritePerMtok` lookup rates, full-input-rate fallback).
  - New opt-in `ProviderRequest.cachePolicy` / `AgentConfig.cachePolicy` (`{ breakpoints: 'auto', ttl? }`): the vercel adapter anchors Anthropic `cache_control` on the first and last conversation messages so the stable prefix is written once and read at the discounted rate every later step.
  - `ModelPrice` gains `cacheWriteUsdPerToken`; `calculateCost` bills cache writes; the bundled pricing snapshot is regenerated (2026-07-04) with current Anthropic 4.x / OpenAI gpt-5 + gpt-4.1 + o3/o4-mini / Gemini 2.5 families (legacy ids retained), `lookupPrice` resolves dated ids via a date-suffix fallback, and a new snapshot-coverage release gate cross-checks the model-tier classifier against the snapshot with an explicit known-unpriced allowlist (post-cutoff models report null cost + WARN instead of invented numbers).
  - Cache-friendly catalogue: handoff tools serialize BEFORE the growing promoted section (byte-stable prefix under `tool_search` promotions), and new `toolPromotion: 'run-boundary'` freezes the advertised catalogue for a whole run while still persisting discoveries.

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

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable workflow orchestration (audit 2026-07-04 Wave D, cluster D1) - promotes the workflow engine to step-checkpoint durable execution and closes the confirmed `workflow-01..14` correctness floor.

  - Feature floor: atomic checkpoint compare-and-set (`CheckpointStore.put({ expectedLatestId })` + `CheckpointConflictError`, honoured by both bundled stores), planned-order channel writes, merge-failure + boundary-abort + max-steps terminal checkpointing, all-false-`__start__` dead-end, ephemeral-value observability on `workflow.channel.update`, satisfied-pause retention on sibling failure, `maxConcurrentTasks` bounded task pool, `Dispatch` cross-realm brand, and hygiene (dead `visitedNodes`, six->seven stream modes, `'async'` source removed, resume durability override).
  - New durable capabilities: per-node `timeoutMs` + `retry` (`nodeDefaults`), durable timers (`sleepUntil`/`sleepFor` + `workflow.tick`), durable promises (`awaitExternal` + `resolveAwakeable`), persisted approvals (`requestApproval` + `approve`), `WorkflowConfig.version` pinning (`workflow-version-mismatch`) + journal-divergence detection, and opt-in step journaling (`journalSteps`) with crash-recovery that replays completed tasks and re-runs only unfinished work.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Sub-agent isolation & orchestration primitives (audit 2026-07-04 Wave D, cluster D2).

  - Run-level `'read-only'` capability (single-writer constraint): `AgentConfig.capability` / `AgentCallOptions.capability` never advertise writer tools or handoffs and the executor deterministically blocks fabricated writer calls with the new `capability_blocked` `ToolErrorKind` (threaded through `executeBatch`/`executeOne`, HITL resume, and the code-mode bridge).
  - `toTool({ contextFold })` returns a compact distilled child-run outcome instead of raw output; `toTool({ propagateTaint })` (default on) carries the child's coarse taint flags across the fold as a widen-only `ToolReturn.taint` override (`sourceKind: 'sub-agent'`) that re-arms the parent's data-flow ledger.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Memory architecture evolution (audit 2026-07-04 Wave D, cluster D3) - opt-in; defaults byte-identical.

  - Learned-context digest block (Letta sleep-time): a deep-phase pass rewrites the reserved `learned_context` working block from recent evidence via one budgeted LLM call (`consolidator.learnedContext`, off at every tier).
  - Principal/owner dimension (`MemoryOwner` on facts/episodes/rules/insights, migration 026) stamped `'agent'` on synthesized writes, with a retrieval-time `owner` filter (`FactSearchOptions.owner`); default reads apply no filter.
  - Retrieval-frequency reinforcement: `facts.access_count` (migration 027) + opt-in `SalienceWeights.accessReinforcement` (default 0 = inert).
  - Runbook memory: `rules_fts` (migration 028) + `ProceduralMemory.search` returns whole validated procedures, with a gated `runbook_search` tool (`createMemory({ runbookSearch: true })`).

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (audit 2026-07-04 Wave D, cluster D4) - architectural, deterministic layers.

  - RFC-6962 Merkle transparency over the audit log (`@graphorin/security/audit`): tree head, inclusion + consistency proofs, and Ed25519-signed checkpoints, so anchoring a signed head out-of-band makes the trail tamper-resistant (a rewrite of a checkpointed prefix fails the consistency proof).
  - Operator trust root for skills: `verifySkillSignature`/`installSkillFrom{Npm,Git}` gain `trustRoot` - a valid signature from a key absent from the root returns `valid: false` reason `'untrusted-key'`.
  - Progent-style tool-argument policies + Rule-of-Two capability profiles (`@graphorin/security/policy`): `AgentConfig.toolPolicy` (forbid-before-allow, default-deny sensitive) + `ruleOfTwo` (drops a lethal-trifecta leg, forcing a read-only capability floor) enforced by a new `ExecutorOptions.argumentPolicy` hook (`capability_blocked`).
  - Code-mode sandbox blocklist parity (`bridged-source.ts`) blocks the process-escape modules (child_process/vm/worker_threads/cluster/inspector) via the ESM resolve hook + a CJS `Module._load` patch.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval SOTA graph wins (audit 2026-07-04 Wave D, cluster D5) - offline, opt-in; the billed/migration-heavy legs stay eval-gated.

  - PPR-lite graded expansion (HippoRAG-style damped spreading activation): `SqliteGraphStore.expandActivation` + `FactSearchOptions.expandHops: 0|1|2` + `graphScoring: 'ppr'` score neighbours by `damping^hopDepth` instead of a flat 1.
  - Graph + entity as first-class tunable fusion weights (`FusionWeights.graph` / `.entity`, were hardcoded neutral).
  - Exact entity-match retriever: `SqliteGraphStore.factsForEntityName` + `FactSearchOptions.entityMatch` add a precise "facts about <entity>" candidate leg.
  - `longmemeval` harness gains `--retrieval ppr` / `--retrieval entity`. Bitemporal event time, Matryoshka truncation, and cascade LLM reranking remain eval-gated.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Context engineering trial (audit 2026-07-04 Wave D, cluster D6) - opt-in; tool surface unchanged by default.

  - Structured plan tool (`update_plan`, TodoWrite-style full-replace checklist) journaled in the new `RunState.todos` (core `TodoItem`), surviving suspend/resume via the strict run-state (de)serializer.
  - Attention recitation: the current plan is rendered into a compact `<plan>` block appended to each step's request copy - request-only and cache-layout-aware (rides the last prompt-cache anchor, never touches the shared buffer or persisted state).
  - `AgentConfig.plan` opt-in. Progress files, resume-recap injection, and the degraded-mode ladder are documented as trial follow-ups.

### Patch Changes

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Session hard-delete and the RP-6 retention sweep now purge the session's CONTENT (store-01): `session_messages` rows plus their FTS and per-embedder vector index entries, and episodes scoped to the session, all inside the existing cascade transaction. Previously no code path anywhere deleted `session_messages`, so a "deleted" conversation stayed permanently searchable via `memory.session.list/search` - a GDPR hazard for a privacy-positioned framework. The core `SessionStoreExt.deleteSession` contract is updated to document the content cascade.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Provider adapters now match their real SDK / wire contracts (audit 2026-07-04 Wave B, cluster B1).

  - vercel adapter: Graphorin tools convert to the AI SDK's name-keyed record with `jsonSchema()`-shaped input schemas; assistant `toolCalls` become `tool-call` content parts, `ToolMessage`s become `tool-result` messages, system-role messages hoist into the `system` option, and `toolChoice` maps onto the SDK spelling. Tool loops now run against the real `ai` peer (previously every tool conversation failed SDK validation). A real-SDK contract test suite (dev-only `ai` dependency) pins the shapes.
  - Anthropic token counter posts Anthropic wire-shaped bodies (system hoist, `tool_use` / `tool_result` blocks, turn merging) instead of raw Graphorin messages that 400'd on any agent transcript; degradation to the tiktoken fallback now WARNs once.
  - HTTP errors carry a canonical `errorKind` (shared `classifyHttpStatus` mapper: 429 rate-limit, 401/403 unauthorized, 5xx transient/capacity, context-length body sniff) plus captured `retry-after` / `x-ratelimit-*` headers; `withFallback` / `withRetry` consult them, so a 429 on the primary finally fails over and honours server-provided delays.
  - llamacpp-node: the system prompt is no longer injected twice, per-request contexts/sequences are disposed after every stream (KV-cache leak), and aborted streams report `finishReason: 'aborted'`.
  - OpenAI-compatible streaming sends `stream_options: { include_usage: true }` so vLLM / Together / OpenAI report real usage; `openAICompatibleAdapter` gained the `capabilities` / `timeoutMs` options its siblings had.
  - `withCostTracking` bills separately-reported reasoning tokens at the output rate; classifiers recognise Bedrock cross-region ids (`us.anthropic.claude-...`) and the AI SDK's dotted provider ids.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval and consolidation now honour the trust contracts they document (audit 2026-07-04 Wave B, cluster B3).

  - memory-retrieval-01: default fact reads (FTS / vector / graph) behave as `asOf = now`, so superseded and validity-expired facts no longer surface as current - exactly what the `fact_supersede` tool promises. New `includeSuperseded: true` escape hatch (core `MemorySearchOptions`, memory `FactSearchOptions`, graph expand options) restores the full history for inspector / audit paths; `fact_search` and `deep_recall` outputs expose `validTo` / `supersededBy`.
  - memory-retrieval-02: `deep_recall` passes `forceHard: true` (choosing the tool IS the hardness signal; the local heuristic gate rejected the tool's own documented examples and is English-only). Iterative results carry a new `graded` flag so ungraded single-shot passes stop claiming sufficiency as a verdict.
  - memory-retrieval-03: a tagged search widens the fusion pool the same way decay does - the record-level tags filter runs after the topK cut, so tagged searches no longer silently return fewer than topK hits.
  - memory-consolidation-01: the deep-phase dedup verdict now soft-forgets (replayable tombstone) instead of preferring the GDPR hard-delete `purge`, and a vanished conflicting fact skips the judge entirely (admit, no provider call) - a model verdict can no longer hard-delete the only surviving copy.
  - memory-consolidation-07: the standard phase gains an embedder-independent exact-text duplicate guard (FTS + string equality, quarantine-aware), so replaying a partially-committed slice (DLQ / cursor retry) without an embedder no longer duplicates already-committed facts.

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the dependency-free root package for the Graphorin
  framework. Ships the public type system (`Message`, `AgentEvent`,
  `WorkflowEvent`, `RunContext`, `RunState`, `Usage`, `Sensitivity`,
  `MemoryKind`, `MemoryMetadata`, `Handoff`, `StopCondition`, …), every
  cross-package contract interface (`Provider`, `Tool`, `Logger`,
  `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
  `AuthTokenStore`, `EmbedderProvider`, `TokenCounter`, `Tracer`,
  `AISpan`, `RedactionValidator`, `SecretsStore`, `SecretValue`,
  `SecretRef`, `SecretResolver`, `Sandbox`, `EvalScorer`, …) and a small
  set of dependency-free utilities (`collect`, `mapStream`, `merge`,
  `withSignal`, `assertNever`, `md5`, `xxhash`, …).
- Workflow channel primitives under `@graphorin/core/channels`:
  `Directive`, `Dispatch`, `pause`, `LatestValue`, `Reducer`, `Stream`,
  `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate` - Graphorin's own
  vocabulary; names are part of the public API.
- Typed no-op defaults `NOOP_TRACER` and `NOOP_LOGGER` so downstream
  packages can carry a non-null observability surface without taking the
  observability dependency.
- `zod` is declared as a peer dependency (`^3.23 || ^4`); `@graphorin/core`
  has no other runtime dependencies and no internal dependencies on any
  other `@graphorin/*` package.
