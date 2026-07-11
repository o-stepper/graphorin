---
title: Migration (pre-1.0)
description: How Graphorin versions move before 1.0 - the versioning policy, storage migrations, and what to expect when upgrading.
---

# Migration (pre-1.0)

Graphorin is pre-1.0. This page tracks how versions move and what to expect
when upgrading.

## Versioning policy

- **Lockstep until 1.0.** Every `@graphorin/*` package shares one version and
  is released together. Install matching versions across the scope.
- **Pre-1.0 semantics.** Per semver, `0.x` minor bumps (`0.1 → 0.2`) may carry
  breaking changes. Patch bumps (`0.1.0 → 0.1.1`) are fixes only.
- **Breaking changes** land in the root [changelog](/reference/changelog) as
  part of each version's thematic release notes (there is no dedicated
  "breaking" subsection today); the per-package `CHANGELOG.md` files point
  back to the root changelog for the full notes. The
  [version notes](#version-notes) below distil the upgrade-relevant changes
  per version.

## Upgrading

```bash
# Upgrade the whole scope together (lockstep).
pnpm up "@graphorin/*@latest"
pnpm install
pnpm build && pnpm typecheck && pnpm test
```

After upgrading:

1. **Re-read the changelog entry** for the target version, plus the matching
   [version notes](#version-notes) section below.
2. **Rebuild** so producer `dist/*.d.ts` are current before downstream
   typecheck.
3. **Run your tests.** Strict TypeScript surfaces most contract changes at
   compile time.

## Version notes

### Before any upgrade

- **Back up the SQLite file**: `graphorin storage backup <dest>` takes an
  online, consistent copy (safe under a live writer; an encrypted store
  produces an equally encrypted copy).
- **Read the root [changelog](/reference/changelog) entry** for the target
  version.
- **Bump every `@graphorin/*` package together** (lockstep):
  `pnpm up "@graphorin/*@latest"`. Mixed versions across the scope are not
  supported.

### 0.6.x -> 0.7.0

0.7.0 lands the full 2026-07 project-review remediation train (six
waves, 157 findings), so the upgrade surface is the largest since
0.5.0. The notes below are grouped; skim the bold group leads and read
the groups that touch your deployment.

**Environment and install.**

- **Node floor is now 22.12** (`engines.node: '>=22.12.0'`, previously
  `>=22.0.0`): the packages' export maps switched from an `import`-only
  condition to `default`, so CommonJS consumers can plain `require()`
  them - stable `require(esm)` needs Node 22.12. Installs on Node
  22.0-22.11 with `engine-strict` will refuse; upgrade Node. There is no
  dual-instance hazard (no CJS build exists - `require()` returns the
  same ESM instance).
- **zod ^4 consumers now typecheck** against `@graphorin/core`,
  `@graphorin/tools`, `@graphorin/memory` and `@graphorin/mcp` at
  `skipLibCheck: false`. Type-level note: `ZodLikeError.issues[].path`
  widened from `string | number` to `PropertyKey` elements, and the
  published d.ts no longer bake concrete zod v3 generics.
- `@graphorin/observability` no longer declares `@opentelemetry/*` peer
  dependencies (they were phantom - the package has zero OTel imports),
  so installs stop demanding `@opentelemetry/api` and the `ERESOLVE`
  from the stale caret-pinned peers is gone. Upstream OTel SDK
  pipelines adapt via the exported `toOtlpEnvelope`.
- Phantom workspace dependencies were removed across eight packages
  (for example, `agent` no longer depends on `provider` or
  `observability`). If your code imports a `@graphorin/*` package it
  only received transitively, declare it as a direct dependency.
- The server's sibling peer floors (`@graphorin/agent` / `memory` /
  `sessions` / `workflow`) now track the current minor: mixed-version
  installs (say `agent@0.6.x` under `server@0.7.0`) refuse to resolve.
  Upgrade the whole scope together, as the lockstep policy requires.
- Tarballs now ship `src/` so the published declaration maps resolve
  (go-to-definition lands in TypeScript source); installs get slightly
  larger.
- Publishing moved to npm trusted publishing (OIDC). No consumer
  action: packages keep Sigstore build provenance.

**Storage schema and data (back up first).**

- The store schema advances to **migration 032**: 029 links
  HITL/workflow checkpoints to their session, 030 adds the span-end
  index, 031 drops the dead `trigger_fire_log` table (never written or
  read by any code), 032 adds `workflow_checkpoints.wake_at` for
  durable timers. Migrations run automatically when the store opens.
- Migration 022 gained a data-repair preflight: databases that
  actually hit the session-sequence duplicate race can now upgrade
  (duplicates are deterministically renumbered inside affected
  sessions only; everything else is byte-for-byte untouched).
- Threads suspended before migration 032 carry no `wake_at` and stay
  invisible to the new timer driver until one manual `tick` or a
  resume re-persists them.
- Read-only CLI commands (`memory inspect`/`activity`,
  `traces status|prune`, `triggers list|status|fire|disable|prune`,
  `consolidator status`, `dlq-list`) no longer auto-migrate: pointed
  at a behind-schema or never-migrated database they refuse with
  instructions instead of upgrading the schema under a live server.

**Retention: the server now deletes old data by default.**

- A unified retention sweep (default every 6 hours) prunes derived
  data out of the box: spans older than 30 days, consolidator run
  counters older than 90 days, exhausted DLQ batches older than
  30 days, and expired idempotency records. On upgrade, old span
  telemetry and expired idempotency bodies start being deleted - set
  `retention: { enabled: false }` or widen the windows to keep them.
  Primary content (sessions, audit, memory history, workflow threads)
  is pruned only through explicit opt-in windows.
- An existing cron `graphorin traces prune` now actually deletes old
  spans - the command used to be a silent no-op against a table that
  never existed.
- Session hard-delete now erases everything session-scoped: distilled
  facts, insights, spans and working blocks (via the
  `SESSION_SCOPED_PURGES` registry) plus suspended-run checkpoints.
  `session.replay()` for a deleted session no longer reconstructs the
  run - that is what hard-delete means.

**Security and auth behaviour.**

- The `audit.cipher` config setting is now honoured; it was silently
  ignored, so every existing `audit.db` is in `chacha20` format and
  the default is pinned to `chacha20` to stay byte-compatible. A
  config that has long carried `audit.cipher: 'sqlcipher'` will now
  fail to open its existing file - remove the setting or re-encrypt
  the audit database. Unknown cipher values fail fast.
- `pruneAudit` fails closed on custom `AuditDb` bindings without the
  new optional `transact` member. After any destructive prune, sign
  and distribute a fresh Merkle checkpoint (the CLI prints the
  reminder; the security guide carries the runbook).
- Skill trust root: the `publishers` leg now counts only for keys
  resolved through the `well-known` channel, and the key URL's host
  must match the publisher domain (or a subdomain). Breaking for
  publisher ids that are not DNS names or keys hosted off-domain -
  align them, or switch those entries to the `fingerprints` leg.
- Rule-of-Two profiles that give up the `untrustedInput` leg now
  actually forbid untrusted-source tools (web search, MCP) - expect
  denials where the leg was previously bookkeeping-only.
- `POST /v1/tokens` is attenuation-only: minting a scope the minter's
  own grant does not cover answers `403 scope-escalation-denied`.
  Grant minting integrations the full target scope set (or
  `admin:*`); syntactically invalid scopes now answer 400.
- Scopes are symmetric per resource: session REST reads and the SSE
  fallback accept `sessions:<verb>:<sessionId>` grants (session-scoped
  tokens gain the REST/SSE access they already had on WS), while run
  control (REST `/runs/:runId/*`, WS `run.cancel`) resolves the run
  and requires the owning `agents:...:<agentId>` /
  `workflows:...:<workflowId>` grant - a three-segment grant for
  another agent's run is now denied.
- `POST /v1/agents/:id/stream` rejects a malformed body with
  `400 config-invalid`; clients that relied on the silent 202 (which
  launched the agent on an empty prompt) must send a valid body.
- With an audit chain configured, security-relevant tool events
  (dataflow flags, sanitization hits, approvals, collisions) are now
  appended to it by default; tune with
  `audit.toolEvents: 'security' | 'all' | 'off'`.

**MCP identity and pinning.**

- MCP server identity is now transport-derived (the self-reported name
  survives as display-only `reportedServerName`). Existing TOFU
  `pinStore` records keyed by old server-controlled ids orphan and
  re-pin under the transport id on first `toTools()`; operators
  running `onPinMismatch: 'reject'` must re-pin. Registry auto-prefix
  namespaces (model-visible prefixed tool names) may change.
- With a `pinStore`, a tool added after the first-use recording is now
  rejected by default (`MCPToolPinningError`). Servers that
  legitimately extend their catalogue: use `onPinMismatch: 'warn'` or
  the new `'accept-and-update'`.
- Model-facing bytes may change: MCP tool-schema annotations and
  `isError` text are sanitized at the boundary (semantic schema
  keywords are never modified; input validation is byte-identical).

**Agent runtime behaviour.**

- Sub-agent suspension (composed durable HITL): a handoff or `toTool`
  child that suspends on an approval-gated tool now parks on the
  parent - the run ends `awaiting_approval` with the child's approvals
  mirrored into `pendingApprovals` - instead of surfacing a terminal
  `execution_failed`. Echo `subRunToolCallId` (alongside `toolCallId`)
  back in `ApprovalDecision`. Failed and aborted children still
  surface as tool errors.
- Child-run usage now folds into the parent's
  `usage`/`usageByModel`: budget hooks and pricing start seeing the
  real (larger) numbers, and run-level `gen_ai.usage.*` attributes
  include delegated tokens.
- `RunState.currentAgentId` is restored to the parent when a handoff
  child returns: post-handoff `RunStep.agentId`, resume attribution
  and session JSONL exports now identify the parent agent (the child
  stays durably recorded in `RunState.handoffs`).
- `RunStep.stepNumber` is strictly monotonic across suspend/resume:
  the resume step takes max + 1 instead of a hard-coded 0. Dashboards
  that expected resume steps numbered 0, or post-resume numbering to
  restart, must adapt.
- Abort policy: aborting with an empty approval queue now ends
  `'aborted'`, never `'failed'` (`onPendingApprovals: 'fail'` fails
  the run only when approvals are actually pending); `'deny'` commits
  a tool message per drained approval.
- Streaming provider failures are typed: a 429/500/529 arriving before
  any content now throws a `ProviderHttpError` (so retry and fallback
  engage) instead of yielding `stream-start` plus an inert error
  event; a mid-stream error finishes with `finishReason: 'error'`
  instead of a synthetic `'stop'`. Breaking for consumers that relied
  on a yield-first error event or on `stream-start` always preceding
  the throw.
- Transcripts may carry several reasoning parts per step now that
  per-block thinking signatures round-trip.
- Writes through `ctx.state` are compile errors: `RunContext.state` is
  typed as the new `ReadonlyRunState` projection (mutating run
  bookkeeping from tools and hooks was never supported).

**Tools behaviour.**

- An inline timeout now actually aborts the tool (`ctx.signal` fires),
  and a timeout on a `side-effecting`/`external-stateful` tool without
  an `idempotencyKey` reports `recoverable: false` with
  `report_to_user` instead of inviting a blind retry.
- `ToolReturn` unwrapping is brand-based: objects with extra fields
  beyond `{output, contentParts, taint}` now reach the model whole
  instead of being silently stripped to `.output`. Brand deliberate
  envelopes with the new `toolReturn()` factory; a plain
  `{output: X}` stays ambiguous by contract.
- `read_result` handles are run-scoped by default; pass
  `createReadResultTool({ allowCrossRun: true })` for deliberate
  cross-run reads (for example, folding a sub-agent's handle).
- Streaming aggregation is bounded: past `streamingMaxBufferBytes`
  (default 8 MiB) chunks keep reaching subscribers but the assembled
  output is truncated and flagged (`bufferTruncated`).
- Auto-prefix collision losers are now always renamed (deterministic
  hash fallbacks) or observably suppressed - model-visible names of
  colliding tools may change.

**Workflow behaviour.**

- `maxSteps` now caps steps per invocation of
  execute/resume/retry/tick (the documented infinite-loop safeguard),
  not per thread lifetime. If you relied on the lifetime cap, set the
  new `WorkflowConfig.maxTotalSteps`.
- Positional `pause()` replay verifies which pause a journaled value
  answered: a workflow whose pause order depends on time, state or
  model output now fails with the typed `pause-replay-divergence`
  error instead of delivering values to the wrong wait.
- The JSON-safety gate now covers pause values, approval payloads,
  `Dispatch` args and operator directives - a `Date` in
  `Directive({ resume })` fails at resume entry instead of silently
  becoming a string on the next replay.
- Custom `CheckpointStore` implementations used with the new timer
  driver must implement `listSuspended` (otherwise
  `TimerDriverStoreUnsupportedError`).
- Step-journal semantics, documented honestly: journaled channel
  writes replay exactly once, side effects are at-least-once - keep
  effects idempotent.

**Memory behaviour.**

- Supersede defers interval closure: while an extraction-provenance
  successor sits in quarantine, recall returns the old fact
  (previously it returned nothing until validation).
  `autoPromoteExtraction` now applies on the update/conflict routes
  too, restoring immediate closure for injection-clean successors
  when opted in.
- A standard-phase slice that exhausts its DLQ retries force-advances
  the cursor past the failed window (bounded, logged, `messageIds`
  kept for manual replay): deliberate bounded fact loss instead of
  consolidation wedging forever.
- Quarantined insights are exempt from reflection pass-decay until
  validated; the unreviewed queue is bounded by
  `reflectionMaxQuarantinedInsights` (default 100; beyond the cap the
  oldest are pruned).
- Compaction summary-trust fails closed: an injection-scanner timeout
  yields `summaryTrust: 'untrusted-derived'`, never `'trusted'`.
- Default search page membership can change where foreign-provenance
  or quarantined facts are in play - the trust discount now applies
  before the final top-k cut. Purely first-party result sets stay
  byte-identical.

**Exhaustive switches and typed contracts.**

- `ProviderEvent` gains `{ type: 'reasoning-end' }`.
- `AgentEvent` gains `subagent.event` - and parents of
  handoff/`toTool` children emit it by default
  (`forwardEvents: 'lifecycle'`).
- `SpanType` opens up (`KnownSpanType` plus the `x.`-prefixed custom
  domain): add a default branch; span-type analytics must tolerate
  unknown strings.
- `WorkflowErrorCode` gains `pause-replay-divergence`.
- The client's `GraphorinClientErrorKind` gains `flow-overflow`.
- Structural contracts: `CostSnapshot` (and its byModel entries) gains
  required `cachedReadTokens`/`cacheWriteTokens`; the tools executor
  now passes the tool's trust class into
  `ToolArgumentPolicyGuard.evaluate` (type-level breaking for custom
  structural guard implementations); `SerializedRunState.messages` /
  `.steps` are typed as their wire projections, and the run-state
  schema is `graphorin-run-state/1.2` (1.0/1.1 snapshots stay
  readable, with corrupted byte payloads repaired best-effort).

**Accounting and observability numbers.**

- `Cost.amount` is whole currency units (dollars), as every producer
  already emitted - if you added a divide-by-100 against the old core
  TSDoc, remove it.
- `CostTracker` memory is bounded by default (10 000 span/scope
  entries, oldest-first eviction, evicted ids read zero);
  `retention: false` restores the old unbounded behaviour.
- Per-type sampling rules now thin child spans under the parent-based
  decision maker - previously-inert rules take effect and child-span
  export volume drops accordingly.
- The `graphorin_replay_buffer_events` gauge now reports buffered
  events (it was wired to the subscription count); dashboards reading
  it see the corrected semantics.
- `llamaCppNodeAdapter` tokenizes the assembled response once, so
  streamed `completionTokens` counts drop to accurate values
  (per-chunk counting over-billed).

**Clients and CLI.**

- WS consumers decoding raw event payloads: binary-bearing events
  (`file.generated`, `tool.execute.partial` chunks, a multimodal
  `agent.end` state) now arrive as JSON-safe wire projections
  (`EncodedBytes` envelopes) - decode with `fromWireAgentEvent` from
  `@graphorin/core`.
- Client subscriptions are bounded (`subscriptionQueueLimit`, default
  10 000): a slow `for await` consumer now gets a typed
  `flow-overflow` close instead of unbounded heap growth (`0`
  restores the old behaviour). On a WS-to-SSE reconnect fallback,
  surviving WS subscriptions close with `TransportFailedError`
  instead of hanging - force `transport: 'ws'` if you need those
  streams.
- CLI `--json` mode now honours exit codes: pipelines that
  (incorrectly) relied on exit 0 on failure - worst of all
  `graphorin audit verify --json` on a broken chain - now see the
  documented exit 1.
- `graphorin init` no longer prints a bootstrap admin token (the
  printed token never verified); `InitCommandResult.bootstrapToken` is
  removed - breaking for scripts that parsed it. Follow the printed
  path instead: pepper via stdin, `graphorin migrate`,
  `graphorin token create`.
- `graphorin storage encrypt --swap` (and
  `encryptDatabase({ swap: true })`) refuses while another connection
  holds the database - stop the server first.

**Evals and lint.**

- Re-seed any locally seeded LOCOMO baselines: the ingested text
  changed (speaker names are rendered, numeric reference answers are
  stringified, and empty-reference QA pairs are skipped).
- `no-implicit-network-call` now activates only for packages whose
  name matches `packagePrefixes` (default `['@graphorin/']`):
  downstream monorepos stop getting errors on their own `fetch()`
  calls; pass your own prefix to police your scope.
- `graphorin tools lint`: repeated-filler descriptions now cap the
  description axis at 16 instead of 40, so `--threshold` gates in CI
  may newly fail on degenerate descriptions.

### 0.5.x -> 0.6.0

- **Durable HITL resume is exactly-once.** With a `checkpointStore` wired, an
  approved call's resume writes a write-ahead intent checkpoint before
  dispatch and the journaled post-dispatch state after it, so resuming from
  the latest state executes the tool exactly once. Re-check operator flows
  that re-resume stale pre-execution snapshots; those stay bounded at one
  re-execution per stale resume.
- **Tool parameters are real JSON Schema on the wire.** Plain Zod input
  schemas are now converted by a structural Zod v3/v4 converter
  (`@graphorin/tools/schema`) instead of leaking serialized validator
  internals to providers; unprojectable schemas degrade loudly (WARN plus a
  permissive `{}`).
- **Workflow durability changes.** The `'async'` durability source is
  removed. `CheckpointStore.put` gained an optional `{ expectedLatestId }`
  compare-and-set argument; both bundled stores honour it (a lost race
  throws `CheckpointConflictError`), and custom store implementations should
  adopt it. `WorkflowConfig.version` pins a workflow definition to its
  checkpoints (`workflow-version-mismatch` on divergence).
- **Store schema advances to migration 028** (fact-supersede indexes, the
  memory owner column, fact access counters, rules FTS). Migrations run
  automatically when the store opens; back up first.

### 0.4.0 -> 0.5.0

- **Approved-tool resume now fires side effects.** Resuming a granted HITL
  approval dispatches the approved call through the executor for real, so
  the side effect happens and its output reaches the model. Update HITL
  integrations that assumed resuming a grant was side-effect-free.
- **Structured tool outputs spill to handles by default.** Over-cap object
  outputs no longer bypass truncation; on the default strategy the full body
  is stored behind a result handle (re-fetchable via `read_result`) instead
  of being inlined whole. Raise a tool's `maxResultTokens` where the model
  must see more inline.
- **Store schema advances to migration 024.** Migrations run automatically
  inside a transaction when the store opens; back up before upgrading
  production.

### 0.3.0 -> 0.4.0

- **The memory program is additive.** Temporal `as_of` reads, provenance +
  quarantine, insights, the entity graph, iterative retrieval, and
  procedural induction are new, opt-in surfaces; existing call sites keep
  working.
- **Store schema advances through migrations 013-017** (provenance,
  insights, fact importance, entities, procedures); they run automatically
  on open.

## Data & schema migrations

- **SQLite store** migrations run automatically at startup inside a
  transaction. Take a backup and test on a staging copy before upgrading
  production. See [Storage backends](/guide/storage).
- **Embedder changes** are governed by the migration policy
  (`lock-on-first` / `multi-active` / `auto-migrate`) - see
  [Embedders](/guide/embedders#embedder-identity-migrations). Changing the
  embedder model is a data migration, not just a config change.
- **Durable run / workflow state** carries a schema version
  (`graphorin-run-state/1.x`). Forward-compatible fields are synthesized when
  reading older snapshots; a major schema bump is documented in the changelog.

## Wire & export formats

- The WebSocket protocol is versioned via the `graphorin.protocol.v1`
  subprotocol; a future `v2` will negotiate explicitly.
- Session JSONL export and tool-cassette formats are versioned (schema `1.0`)
  and read back compatibly within the documented support window.

## When in doubt

Pin exact versions, upgrade in a branch, and run the full gate
(`pnpm run mvp-readiness`) before promoting. Report regressions on the issue
tracker with the from/to versions.
