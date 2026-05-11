---
'@graphorin/core': minor
'@graphorin/observability': minor
'@graphorin/tools': minor
---

Phase 07 — typed tool surface. The new `@graphorin/tools` package joins
the Graphorin framework on top of the foundations from Phase 02
(`@graphorin/core`), Phase 03 (`@graphorin/security`), Phase 04
(`@graphorin/observability`), and Phase 06 (`@graphorin/provider`).
After this phase the agent runtime, the workflow engine, the skills
loader, the MCP client, and the standalone server have a single
strategy-aware surface for declaring, registering, and executing
tools the model can call.

`@graphorin/core` ships:

- **New tool-related discriminator types** — `MemoryGuardTier`,
  `SideEffectClass`, `InboundSanitizationPolicy`,
  `TruncationStrategy`, `ToolTrustClass`, `ToolSource`,
  `ContentChunk`. Hoisted so downstream packages can type their tool
  metadata without a circular dependency on `@graphorin/tools`.
- **Extended `Tool` interface** — additive fields
  (`executionMode`, `secretsAllowed`, `sensitivity`,
  `memoryGuardTier`, `inboundSanitization`, `failClosed`,
  `defer_loading`, `maxResultTokens`, `truncationStrategy`,
  `examples`, `examplesEagerlyRendered`, `sideEffectClass`,
  `idempotencyKey`, `streamingHint`, `preferredModel`). Every field
  is optional so v0.1-alpha consumers continue to compile;
  `streamingHint?: true` is intentionally typed to reject
  `streamingHint: false` so absence remains the canonical
  "non-streaming" signal preserving v0.1-alpha behaviour bytes-equal.
- **`ToolExample<TInput, TOutput>` interface** — type-parameterized on
  the same generics as `Tool` so an example for a
  `Tool<{ q: string }, { hits: T[] }>` cannot specify an
  unrelated `input` shape.
- **`ResolvedTool<TInput, TOutput, TDeps>` interface** — the
  registry-internal record that carries every non-public
  registration-time field downstream layers consume (`__trustClass`,
  `__source`, `__effectiveDeferLoading`, `__sideEffectClass`,
  `__hasIdempotencyKey`, `__streamingHint`, `__exampleCount`,
  `__preferredModel`).
- **Extended `ToolExecutionContext`** — adds the per-call
  `secrets: ToolSecretsAccessor` (ACL-scoped wrapper), and the
  streaming surface (`reportProgress(...)` + `streamContent(...)`).
- **New `AgentEvent` variants** —
  `ToolExecuteProgressEvent` and `ToolExecutePartialEvent` (the
  streaming-tool execution event types).

`@graphorin/observability` ships:

- **`BUILT_IN_IMPERATIVE_PATTERNS`** — sibling catalogue to
  `BUILT_IN_PATTERNS` (PII / secrets) covering the canonical English
  prompt-injection family ("ignore previous instructions",
  "override system prompt", "reveal hidden instructions",
  "developer mode", role-tag injection, `<tool_use ...>` markers,
  …). Disjoint from `BUILT_IN_PATTERNS` by construction.
- **`scanImperativePatterns(body, patterns?, budgetMs?)`** —
  best-effort scan helper with a shared substring prefilter. Returns
  the pattern names that fired AND the bytes the strip would
  remove; returns `null` on budget overrun so callers can apply
  a `'detect-failed'` annotation.
- **`stripImperativePatterns(body, patterns?)`** — replaces every
  match with the canonical
  `[REDACTED:imperative-pattern]` literal token. Bytes-stable,
  parses-equal substitution; preserves surrounding structure so JSON
  / markdown still parses.
- New stable sub-export
  `@graphorin/observability/redaction/imperative-patterns`.

`@graphorin/tools` ships:

- **`tool({...})` builder** — typed factory backed by a Zod-typed
  `inputSchema` / `outputSchema`. Inference flows from the schemas
  into the `execute(input, ctx)` callback. Catches naming-grammar
  violations (whitespace / control chars / >128 chars / characters
  outside the union of every major provider's tool-call wire format)
  at registration with a `TypeError`.
- **`createToolRegistry({...})`** — strategy-aware registry with
  bytes-equal back-compat for the no-arguments
  `assertNoDuplicates()` (throws `DuplicateToolNameError` for
  first-party / inline collisions) AND the strategy-aware
  `assertNoDuplicates(strategy, ctx)` overload that resolves
  cross-source collisions through the
  `'auto-prefix' | 'priority' | 'manual'` strategies. First-party
  precedence is enforced regardless of strategy; the
  trusted-skill > untrusted-skill > MCP precedence ladder is
  enforced under `'priority'`. Returns a `CollisionResolution[]`
  array — single source of truth for the audit emitter and counter
  increment paths. Companion query methods: `register(...)`,
  `unregister(...)`, `get(...)`, `list(...)`, `listEager(...)`,
  `listDeferred(...)`, `searchDeferred(query, k?)`, `size()`,
  `clear()`.
- **Three-tier `searchDeferred` ranking chain** — semantic via the
  injected embedder (cosine threshold `>= 0.5` to count) ⟶ BM25
  fallback (`k1 = 1.2`, `b = 0.75`, default English stopwords;
  locale-extensible) ⟶ regex name-match final fallback. Match
  source surfaced on the result for observability. Embedder cache
  keyed by `(toolName, description hash)`.
- **`createToolExecutor({...})`** — runs `Tool[]` invocations:
  parallel-by-default with bounded concurrency
  (`maxParallelTools`); `executionMode: 'sequential'` opts a tool
  out of parallelism; approval flow (`needsApproval` predicate ⟶
  blocking gate; emits `tool:approval:requested` audit row;
  resumes on grant; returns
  `ToolError({ kind: 'approval_denied' })` on deny);
  per-tool secrets ACL scoping via
  `@graphorin/security/secrets`'s
  `withChildToolSecretsContext`; sandbox-policy resolution via
  `@graphorin/security/sandbox`'s `resolveSandbox(...)` plus an
  optional `sandboxResolver` injection point that delegates to
  `Sandbox.run(...)` for sandbox-bundled handlers (skills, MCP);
  memory-modification guard hook (`memoryGuardFactory` +
  `memoryRegionReader`) that snapshots before / verifies after,
  with the mismatch path emitting a structured audit row + the
  `tool.executor.memory_guard.mismatch.total{toolName,tier}`
  counter; hard-kill cancellation with a configurable grace window
  for tools that ignore `ctx.signal` (cancellation flips the span
  status to `'cancelled'` and surfaces
  `ToolError({ kind: 'aborted' })`); single-round tool repair via
  the operator-supplied repair hook; per-execution `tool.execute`
  AISpan emitted via the run's tracer with rich GenAI-semantic-
  conventions-aligned attributes; per-execution audit + counter
  emission.
- **Default `SpillWriter`** — when no operator-supplied writer is
  configured, the executor writes spill artifacts to
  `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>` with
  `0600` permissions. Operators that need a sandbox-aware path
  (`'worker-threads'` / `'isolated-vm'` / `'docker'` tier
  filesystems) inject their own writer via
  `createToolExecutor({ spill })`.
- **`ToolRegistry.listByTag(tag)`** — query method that returns
  every registered tool whose `tags` array includes `tag`.
  Reaffirms the existing `tags?: string[]` field as the canonical
  declarative cross-cutting metadata channel and feeds the
  `tool_search` regex name-match stage.
- **Result truncation pipeline** — four strategies (`'middle' |
  'tail' | 'spill-to-file' | 'summarize'`) honouring per-tool
  `maxResultTokens` (default `16384`; `0` disables with a one-time
  WARN). Pluggable `TokenCounter` (defaults to
  `countTokensHeuristic`, the 4-chars-per-token fall-through used
  when no per-provider counter is configured); pluggable
  `ResultSummarizer` and `SpillWriter` hooks the agent runtime
  injects from `@graphorin/provider`'s token counters and from the
  configured artifact-root / sandbox tmpfs view. Truncation
  annotations are bytes-stable AND calibrated to NOT match any
  imperative-pattern.
- **Inbound prompt-injection sanitization** — five-policy pipeline
  (`'pass-through' | 'detect-and-flag' | 'detect-and-strip' |
  'detect-and-wrap' | 'detect-and-strip-and-wrap'`) with
  trust-class default matrix:
  `'pass-through'` for built-in trusted; `'detect-and-flag'` for
  user-defined and trusted-skill; `'detect-and-strip-and-wrap'` for
  untrusted-skill, MCP-derived, and web-search adapters. The
  `<<<untrusted_content trust="..." tool="..." origin="...">>>`
  envelope wraps the sanitized body; the
  `[REDACTED:imperative-pattern]` literal replaces stripped
  matches. Optional `failClosed: true` per-tool opt-in surfaces
  hits as `ToolError({ kind: 'inbound_sanitization_blocked' })` for
  regulated deployments.
- **Streaming-tool execution surface** — opt-in via
  `tool({ streamingHint: true })`. Per-`toolCallId` aggregation
  buffer with the buffer-becomes-output discipline (the
  `ContentChunk[]` is concatenated into the assembled `output` when
  `execute` returns `void`). Bounded backpressure queue
  (`streaming.eventQueueDepth`, default `256`) drops the oldest
  in-flight event under load while the buffer remains lossless.
  `tool.execute.progress` and `tool.execute.partial` AgentEvent
  variants are emitted into the agent stream; `chunkIndex` is
  monotone-increasing per `toolCallId` so subscribers can detect
  drops.
- **Side-effect classification** — `sideEffectClass` REQUIRED on
  the public surface (with a v0.1 transition mode that emits a
  one-time WARN per tool name on missing classification and applies
  the conservative deferred default `'side-effecting'`).
  Companion `idempotencyKey?: (input, ctx) => string` callback
  REQUIRED-by-WARN for `'side-effecting' | 'external-stateful'`
  tools; the framework never validates determinism (operator
  contract; documented honestly).
- **Per-tool model preferences** — `preferredModel?: ModelHint |
  ModelSpec` field with the cost-tier vocabulary
  `'fast' | 'balanced' | 'smart'` from `@graphorin/core`. Bytes-equal
  preservation across `'auto-prefix'` collision rename. Throws
  `InvalidPreferredModelError({ toolName, value })` on invalid
  shapes at registration.
- **Worked examples** — `examples?: ToolExample[]` per tool
  (bounded `[1, 5]` with WARN-on-overflow). Each example's `input`
  and `output` is validated against the tool's
  `inputSchema` / `outputSchema` at registration; programming
  errors fail-fast with `InvalidExampleError({ toolName,
  exampleIndex, field, validationError })`.
- **Built-in tools** —
  `createToolSearchTool({ registry })` for the
  `tool_search({ query, k? = 5 })` deferred-tool catalogue lookup;
  always registered by the agent runtime when at least one tool in
  the registry has `__effectiveDeferLoading === true`.
- **Audit + counter registry** — `emitToolAudit(...)` /
  `onToolAudit(...)` for sanitized audit-event broadcasting (never
  the raw tool args / result bytes); `incrementCounter(...)` /
  `observeHistogram(...)` / `setGauge(...)` /
  `snapshotCounters(...)` for the in-process metrics registry.
  Counter taxonomy follows a stable prefix-per-RB convention
  (`tool.collision.*`, `tool.inbound.sanitization.*`,
  `tool.result.*`, `tool.retrieval.*`, `tool.classification.*`,
  `tool.streaming.*`, `tool.preferred-model.*`,
  `tool.executor.*`).
- **Typed errors** — `DuplicateToolNameError`,
  `InvalidExampleError`, `InvalidPreferredModelError`,
  `InvalidSideEffectClassError`, `ToolExecutionAggregateError`,
  `ToolCollisionError`. All carry a lowercase `kind` discriminator
  and an optional `hint` field surfaced in CLI output.

This phase introduces no breaking changes — every additive `Tool`
field is optional so v0.1-alpha consumers continue to compile.

`pnpm test` — 86 new tests across the
`@graphorin/tools` package; the workspace passes 1518 tests across
13 packages with 0 failures and no implicit network calls
(`pnpm run check-no-network: PASS`).
