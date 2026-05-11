---
'@graphorin/memory': minor
---

Phase 10d — ContextEngine + memory-aware system prompt. The layered
six-layer system prompt assembler is now production-ready: the
locale-aware base template (English default + pluggable locale packs
via `defineContextLocalePack(...)`), per-record D2 sensitivity-tier
filter, priority-ordered token-budget allocator, opt-in auto-recall
heuristic + pluggable strategy, content-origin / inbound-trust
annotations for the D3 / D4 cooperation contract, per-step
tool-catalogue cardinality allocator, and the in-flight session
message-history compaction subsystem all ship together as a
self-contained sub-package under `@graphorin/memory/context-engine`.

`@graphorin/memory` ships:

- **`createContextEngine({ ... })` factory + `ContextEngine` runtime
  surface.** Exposes the three public methods Phase 12 (agent
  runtime) consumes: `assemble(memory, input)` returns the
  per-step `AssembledPrompt` with the layered `systemMessage`,
  per-part `ContentAnnotation`s, the resolved `LayerAllocation`
  snapshot, the privacy-counter audit, and the resolved locale id;
  `shouldCompact(messages)` is the trigger evaluation primitive
  the runtime calls at the top of every step; `compactNow({ ... })`
  trims the in-flight buffer via the configured strategy and fires
  every registered post-compaction hook synchronously. `config()`
  surfaces the resolved configuration snapshot for the standalone
  server's health endpoint (Phase 14) and the CLI (Phase 15).
- **Six-layer system prompt template (RB-04 / ADR-022).** Layer 1
  ships an educational base prompt that teaches the model when to
  call `fact_search` / `recall_episodes` / `conversation_search`
  and when to mutate via `block_*` / `fact_remember` /
  `fact_supersede` / `fact_forget`. `memoryBaseMode: 'full'`
  (default) ships the verbose ~250-350 token narrative aimed at
  general LLMs; `memoryBaseMode: 'minimal'` opts top-tier models
  into the ~80-120 token compact form. Layer 2 wraps the
  user-supplied `agent.instructions` inside `<agent_instructions>`.
  Layer 3 renders the working-memory blocks via a deterministic
  XML envelope.   Layer 4 renders the active procedural rules and
  the progressive-disclosure skill metadata cards.
  Layer 5 renders the memory-counter snapshot block surfaced
  through `memory.metadata(scope)`. Layer 6 is the opt-in
  auto-recall layer that injects facts above the configured
  cosine threshold.
- **Locale-aware composer (RB-08).** The framework is locale-agnostic
  — no language is privileged in core. The bundled English locale
  pack (`enLocalePack`) is the default; consumers register
  additional locales via `defineContextLocalePack({ id,
  baseTemplate?, autoRecallTriggers?, inboundSanitizationPreamble?,
  compactionSummaryTemplate? })`. Partial packs are accepted: any
  field omitted falls back to the English default at compose time
  with a one-time WARN per locale per missing surface (the safety
  guarantee is preserved even when an operator installs a partial
  locale pack). Tool names + parameter names always remain English
  per the documented tool-calling-accuracy contract (RB-04 / P4).
- **Priority-ordered token-budget allocator** (`allocateTokenBudget`).
  Walks the six layers in `identity → memoryMetadata → activeRules
  → workingBlocks → activeSkills → autoRecall` priority order,
  enforces per-layer caps (`layers.<id>.cap`), and truncates the
  lowest-priority overflowing layer first with a `[...truncated]`
  marker. Identity layer is always preserved; AutoRecall is
  truncated first. Pluggable token counter: defaults to a
  deterministic chars-per-4 heuristic; consumers wire any
  `TokenCounter` from `@graphorin/core` via
  `contextEngine.tokenCounter` (the production
  `JsTiktokenCounter` lives in `@graphorin/provider`). Pure
  function; deterministic snapshot-friendly output.
- **Privacy filter (D2 layer of the four-layer defense-in-depth
  model — DEC-126 / DEC-149 / ADR-013 ext).** `partitionBySensitivity`
  + `privacyDecide` enforce the documented decision matrix:
  `'public'` always passes; `'secret'` only on `loopback` providers
  that explicitly accept `'secret'`; `'internal'` requires either
  loopback / private trust OR `cloudUploadConsent: true` on
  cloud-tier providers. Per-provider overrides
  (`providerAcceptsSensitivity`) always win. Counters per drop
  reason (`provider-rejects-secret`, `provider-rejects-internal`,
  `no-cloud-upload-consent`, `allowed`) surface through
  `AssembledPrompt.privacyCounters` for the audit trail.
- **Content-origin annotations (cross-cut DEC-157 / ADR-045 § 12).**
  Every assembled `MessageContent` part carries a typed
  `ContentAnnotation` exposing both the `graphorin.content.origin`
  axis (`'memory:tier-filtered' | 'system:framework' |
  'agent:instructions' | 'skill:content' | 'user:input' |
  'tool:result' | 'mcp:response' | 'tool-call:args'`) and the
  sibling `graphorin.content.inbound.trust` axis (`'trusted' |
  'user-defined' | 'untrusted-skill' | 'mcp' | 'web-search' |
  'n/a'`). The non-tool-result origins are forced to
  `inboundTrust: 'n/a'` by `annotate(...)` so callers cannot
  accidentally violate the rule. The annotation is span-only —
  never serialized to the wire payload.
- **D4 inbound-sanitization preamble (RB-43 / DEC-159).** The English
  preamble at `@graphorin/memory/context-engine/preambles/inbound-en.ts`
  is the cache-friendly ~80-120 token notice the agent runtime
  appends to the system prompt **after** the cache breakpoint on
  steps containing untrusted upstream parts. The
  `shouldFireInboundPreamble(annotations)` predicate exposes the
  trigger rule (any non-`'trusted'` non-`'n/a'` part fires the
  preamble); locale-extensible via
  `defineContextLocalePack({ inboundSanitizationPreamble: { text } })`
  with the partial-pack fallback contract.
- **Auto-recall heuristic + pluggable strategy.**
  `defaultLocaleHeuristicStrategy(pack)` builds the regex-driven
  trigger evaluator for any locale pack (English defaults match
  `"do you remember"`, `"what did we discuss"`, `"last time"`,
  `"earlier"`, `"my preference"`, …); `defineAutoRecallStrategy({
  id, evaluate })` is the escape hatch for application-supplied
  custom strategies (per Q-025 / Q-033). Triggered facts are
  filtered through the same D2 privacy filter, ranked through the
  semantic memory's RRF reranker, and injected into Layer 6 with
  the `<auto_recalled_facts>` envelope.
- **Per-step tool-catalogue cardinality allocator (RB-44 / suggested
  DEC-160 / ADR-048).** `allocateToolCatalogue({ eagerTools,
  lazyLoadedTools, toolSearch?, maxToolsInContext, ranker?,
  prepareStepOverride? })` is the second axis of the assembly
  call: it caps the per-step visible tool count at
  `maxToolsInContext` (default `30`), keeps `tool_search` always
  present (exempt from deferral), tracks the per-`RunContext`
  lazy-loaded set with LRU eviction at the cap boundary, ranks
  the eager survivors via the supplied `ToolRanker` (or preserves
  registration order when none is supplied), and bypasses
  everything when the agent runtime passes
  `prepareStep({ tools: [...] })`. Lazy-loaded set bookkeeping
  surfaces through `updateLazyLoadedSet(current, { added?,
  invoked?, evicted? })`.
- **Auto-compaction subsystem (RB-46 / suggested DEC-162 /
  ADR-050).** Lives at
  `@graphorin/memory/context-engine/compaction/`. Disjoint from
  the Phase 10c consolidator: never writes to `semantic_facts` /
  `episodic_episodes` / `procedural_rules`; reads only via
  the public Memory facade surface. `resolveTriggerThreshold({
  contextWindow, trigger?, reservedForResponse?,
  reservedForCompaction? })` resolves the per-provider threshold
  (default `min(contextWindow * 0.85, contextWindow -
  reservedForResponse - reservedForCompaction)` with
  `reservedForResponse: 4096` and `reservedForCompaction: 8192`).
  `resolveAutoCompactionDefault(trustClass)` maps the provider
  trust class to the documented default (ON for cloud-tier
  providers, OFF for loopback). The bundled 9-section structured
  summary template at
  `@graphorin/memory/context-engine/compaction/templates/summary-9-section.ts`
  ships sections (1) Session goal, (2) Decisions, (3) Key facts,
  (4) Open questions, (5) Tools used, (6) Files / artifacts, (7)
  Persona / preferences, (8) Recent turns preserved verbatim
  (filled by the harness, not the summarizer), (9) Compaction
  metadata payload. Three built-in post-compaction hooks
  (`reanchorProjectRules({ ruleTagsAllowlist? })`,
  `reanchorPersonaBlock({ blockLabel = 'persona' })`,
  `reanchorPinnedFacts({ pinnedFactIds, maxTokens? = 2000 })`) ship
  pre-registered so operators get sensible behaviour without
  explicit wiring; a hook that throws is caught + surfaced through
  `hookFailures` + the harness continues with the remaining hooks
  (defense-in-depth: one buggy hook does not break the run).
  `executeCompaction({ ... })` is the pure trim primitive Phase 12
  (agent runtime) calls when the trigger fires; `compactNow({ ... })`
  on the engine instance composes it with the post-compaction
  hook lifecycle.
- **Facade integration.** `createMemory({ contextEngine: { ... } })`
  accepts the new configuration block. The facade exposes the
  resolved engine through `memory.contextEngine` so consumers can
  call `assemble(...)` / `shouldCompact(...)` / `compactNow(...)`
  directly. Existing `memory.compile(scope)` and
  `memory.metadata(scope)` surfaces are preserved for back-compat
  — `compile()` now also returns `base` (the locale-resolved
  Layer 1 fragment) alongside the existing `workingBlocks` /
  `rules` / `metadata` fields, and the privacy filter only fires
  when the operator explicitly opted in via
  `contextEngine.privacy` OR passed `providerAcceptsSensitivity`
  through `CompileOptions`.

`pnpm test` — 89 new tests across the package
(`@graphorin/memory`):

- **Locale + template tests** (9): `composeLayer1` /
  `composeLayer2` / `composeLayer4Skills` /
  `composeInboundPreamble` produce the documented fragments;
  `defineContextLocalePack` rejects empty `id`s; partial locale
  packs fall back to the English default with a one-time WARN per
  `(locale, surface)` tuple; the bundled `'full'` template ≥ 500
  heuristic tokens AND ≥ 4× the bundled `'minimal'` template.
- **Token budget tests** (7): allocator preserves identity,
  truncates auto-recall first, honours per-layer caps, drops
  overflow when `overflowMode: 'drop'`, and `truncateToTokens`
  appends the `[...truncated]` marker only when the input
  overflows the budget.
- **Privacy filter tests** (9): the `decide(...)` decision matrix
  is exhaustively covered (`'public'` always passes; `'secret'`
  drops on cloud-tier; `'internal'` honours `cloudUploadConsent`;
  per-provider override always wins); `partitionBySensitivity`
  emits per-reason counters.
- **Engine assembly tests** (17): all six layers assemble in
  priority order with correct content-origin annotations;
  `memoryBaseMode: 'minimal'` is materially smaller than `'full'`;
  the assembled fixture in `'full'` mode ≥ 600 tokens AND
  the empty-fixture `'minimal'` assembly ≤ 200 tokens (DoD bound);
  per-layer disable + per-layer cap both surface; secret + internal
  drops increment the privacy counters; the inbound preamble
  fragment is appended **after** the cache breakpoint when the
  upstream-trust axis carries any non-`'trusted'` part; trusted-only
  steps skip the preamble; custom locale pack overrides English.
- **Auto-recall tests** (7): English heuristic matches the
  documented trigger phrases (facts + episodes); custom locale
  pack plugs in via `defineContextLocalePack`;
  `defineAutoRecallStrategy` returns a tagged strategy + rejects
  malformed inputs; trigger phrase + matching fact injects into
  Layer 6; non-trigger phrase suppresses Layer 6.
- **Tool-budget tests** (8): no deferral when eager + tool_search
  fits the cap; cap=0 disables auto-deferral entirely;
  auto-deferral fires when `eager.length + 1 > cap` with the
  always-present `tool_search` exempt from the deferred set;
  extreme low cap of `1` keeps `tool_search` visible;
  `prepareStep({ tools })` precedence bypasses the allocator;
  lazy-loaded set evicts oldest by LRU; `lastUsedAt` update via
  `invoked` shifts the eviction; supplied `ToolRanker` picks the
  survivors.
- **Compaction tests** (16): per-provider threshold resolution
  for 200K / 400K / 32K context windows; `'never'` trigger yields
  infinity; explicit `thresholdTokens` wins as-is; default ON / OFF
  resolution per trust class; `shouldCompact` returns false on
  loopback default; `compactNow` trims older messages, preserves
  the recent N turns verbatim, fires the three built-in hooks in
  registration order, and surfaces `hookFailures` when a hook
  throws; cache-prefix stabilization on the second post-compaction
  step (Layer 1-4 prefix bytes-equal across N+2 / N+3); boundary
  discipline against the Phase 10c consolidator is verified
  (consolidator state is not modified by compaction); trigger
  evaluation completes in < 2ms p95 with the DEC-131 cache
  amortization path (precomputed-tokens fast-path).
- **Audit + interface backwards-compat tests** (14): Phase 10a
  `memory.compile(scope)` and `memory.metadata(scope)` shapes
  match the published interface (no breaking change);
  `adaptTokenCounter` correctly wraps a real `TokenCounter` from
  `@graphorin/core`; `countMessageTokens` prefers the native
  `TokenCounter.count(messages)` when available; `renderMessageText`
  approximates non-text multimodal parts; `executeCompaction`
  empty-older-slice short-circuit; `'custom'` strategy invocation;
  `summarizerModel` rendering for the `ProviderLike`, the wrapped
  `{ provider, model }`, and the bare-string forms;
  `compaction: false` explicit-disable contract;
  `reanchorPinnedFacts({ maxTokens })` budget cut-off + empty-list
  short-circuit; `PostCompactionHook` function-form is wrapped
  into a `NamedPostCompactionHook` with an auto-generated id.
- **Snapshot test** (1): the full layered prompt assembled for a
  canonical fixture (English `'full'` mode, two working blocks,
  one procedural rule, one skill metadata card) snapshots
  byte-equal across runs (deterministic for fixtures).

Coverage holds above the package's documented thresholds —
`@graphorin/memory` aggregate: 94.48 % statements / 81.23 %
branches / 95.33 % functions / 94.48 % lines (above the
85 / 75 / 85 / 85 floor). The workspace
`pnpm run check-no-network` continues to pass — no new outbound
network call sites were introduced. Every package typechecks,
lints (Biome), builds, and tests successfully — 330 tests passing
in `@graphorin/memory` alone (up from 241 after Phase 10c).
