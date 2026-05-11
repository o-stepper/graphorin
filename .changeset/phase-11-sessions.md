---
'@graphorin/sessions': minor
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
---

Phase 11 — initial release of `@graphorin/sessions`. The new package
ships the **hybrid facade-with-state** session module that closes
the gap between the agent runtime, the workflow engine, the server,
and the CLI: every package above this layer now has a single typed
entry point for session lifecycle, multi-agent attribution,
JSONL export / import, sanitized replay, and tool-cassette
recording / replay.

`@graphorin/sessions` ships:

- **`createSessionManager({...})` + `Session` facade.** Hybrid
  facade — the package owns sessions / agents / handoffs /
  workflow-attachments / audit metadata, and **delegates** every
  message-shaped call (`Session.push / list / search / compact`)
  to `@graphorin/memory.session` (single source of truth — there is
  no duplicate `session_messages` table, no separate FTS index,
  and no message cache in this package). The facade carries the
  full lifecycle surface: `create / get / find`, `appendHandoff`,
  `listHandoffs / handoffsByAgent`, `attachWorkflowRun /
  workflowRuns / updateWorkflowRunStatus`, `close / fork`, and
  `audit`.
- **`AgentRegistry` singleton with replay-safe lifecycle.**
  `register(id, { displayName, tags?, registeredAt? })`,
  `retire(id, { reason?, assertExists? })`,
  `delete(id, { reason?, assertExists? })`,
  `resolveOrPlaceholder(id)` — returns the metadata for active +
  retired agents and a `{ kind: 'unknown', id }` placeholder for
  hard-deleted agents so replay never crashes on orphan
  references. `hydrate()` rehydrates the cache from the storage
  adapter on process restart.
- **Multi-agent first-class.** Every assistant / tool message
  preserves its `agentId`; `Session.list({ agentId })` filters
  per-agent; `Session.handoffsByAgent(agentId, direction)` filters
  by `'from' | 'to' | 'both'`. Handoff records persist
  serializable input-filter descriptors
  (`HandoffInputFilterDescriptor`) plus the secrets-inheritance
  policy (`HandoffSecretsInheritance`), inherited keys, and
  override reason.
- **JSONL session export schema 1.0** —
  `graphorin-session-export/1.0`. Sentinel `kind: 'meta'` header
  on line 1; sentinel `kind: 'footer'` last line; record kinds
  `meta / session / agent / message / handoff / audit / footer`;
  N-2 backwards-compat band; lenient-forward-parse for unknown
  record kinds (WARN + skip); strict checksum verification when
  `--hash` is used (`SessionExportChecksumMismatchError`); opt-in
  AES-256-GCM body encryption + key derivation helper
  (`deriveSessionExportKey`). Embedder-mismatch lossy-field rules
  drop embeddings on import (with WARN); reasoning content +
  Anthropic-shaped opaque `meta.signature` / `meta.data`
  round-trip bytes-equal. Migrator chain
  (`registerExportMigrator / migrateExport`) for future
  major-version bumps.
- **Tool cassette schema 1.0** —
  `graphorin-tool-cassette/1.0`. Sibling JSONL contract with the
  same N-2 / lenient-forward-parse / `--hash` / `--encrypt`
  discipline. Records carry per-tool `sideEffectClass` + optional
  `idempotencyKey`. The `decideToolReplay(...)` decision engine is
  a **pure function** that, given a recorded record + a live
  invocation surface + the operator-supplied
  `toolReplayMode: 'auto' | 'live' | 'recorded' | 'mixed'`,
  returns one of `tool.cassette.replay.substituted /
  .live / .idempotency-mismatch / .artifact-missing` events. The
  `'auto'` policy honours `sideEffectClass`:
    - `'pure'` / `'read-only'` — substitute from cassette (no WARN).
    - `'side-effecting'` — re-execute live (INFO).
    - `'external-stateful'` — re-execute live with non-silenceable
      WARN (the operator-facing safety gate against silently
      double-firing emails / charges / Linear issues).
  The companion API `Session.recordToolCassette({ outputPath,
  includeArtifacts?, hash?, ... })` returns a recorder the agent
  runtime (Phase 12) wires through `RunContext` events;
  `flushToFile()` writes the JSONL document + optional
  `<outputPath>.artifacts/` directory.
- **`Session.replay({...})` — sanitized-by-default + cassette
  extension.** Walks an iterable of `SpanRecord`s through
  `@graphorin/observability.createReplay` (sanitized scope drops
  `secret`-tagged content + writes `replay.skipped` events); raw
  access requires `traces:read:raw` scope (the configured
  `canReadRaw` predicate gates the path or
  `ReplayAccessDeniedError` is thrown); audit row emitted on every
  invocation. When a `cassette` source is supplied, the replayer
  decodes it to `tool-call` records and emits the per-record
  decision events after the trace-replay completes — keeping the
  consumer's event order deterministic.
- **Per-message commentary-phase trace sanitization.** Built-in
  catalogue (`BUILT_IN_COMMENTARY_PATTERNS`) of seven event-shape
  signatures (`tool.call.start / .delta / .end /
  tool.execute.end / agent.fanout.* / context.compacted /
  agent.model.fellback`) detected in user-visible text parts.
  `commentaryPolicy: 'wrap' | 'strip' | 'pass-through'`
  (`'wrap'` default — wraps detection in
  `<<<commentary>>>...<<</commentary>>>`; `'strip'` removes the
  detection entirely; `'pass-through'` disables the layer). The
  sanitizer is bytes-equal across the four boundaries
  (`session-push`, `session-list`, `session-export`,
  `session-replay`) and idempotent on the same content. Each
  decision emits a `session.commentary.sanitized` audit row + a
  bounded-cardinality counter event
  (`commentary.sanitization.applied.total{boundary, policy,
  reason}`).
- **`session_audit` table on `@graphorin/store-sqlite`.** New row
  added to migration `003-sessions.sql` with `(id, session_id,
  action, actor_kind, actor_id, actor_label, metadata_json, at)`.
  Pruning via `pruneAuditEntries(beforeEpochMs)` for the
  configurable retention window. The `SessionStoreExt` contract
  in `@graphorin/core` adds the additional methods
  (`deleteAgent`, `listAgents`, `updateWorkflowRunStatus`,
  `appendAuditEntry`, `listAuditEntries`, `pruneAuditEntries`)
  the sessions facade depends on; the existing `SessionStore`
  contract is unchanged for downstream consumers.

`@graphorin/core` extensions:

- `MessageContent` parts gain optional `causalityChain?:
  ReadonlyArray<string>` — round-tripped bytes-equal through
  `Session.push / list / export / import` so sub-agent causality
  metadata survives replay. Backward-compat: messages without the
  field continue to round-trip unchanged.
- `HandoffRecord` gains optional `inputFilter?:
  HandoffInputFilterDescriptor`, `secretsInheritance?:
  HandoffSecretsInheritance`, `inheritedSecrets?:
  ReadonlyArray<string>`, `secretsOverrideReason?: string`. The
  serializable descriptor is round-tripped through the JSONL
  session export.
- `SessionStoreExt` extends `SessionStore` with `deleteAgent`,
  `listAgents`, `updateWorkflowRunStatus`, `appendAuditEntry`,
  `listAuditEntries`, `pruneAuditEntries`. `SessionAuditEntry`
  is the new row shape.

`@graphorin/store-sqlite` extensions:

- `SqliteSessionStore` now implements `SessionStoreExt`. Migration
  `003-sessions.sql` adds the `session_audit` table + indexes
  (`idx_session_audit_session`, `idx_session_audit_at`).
  `appendHandoff(...)` persists every additional column the
  sessions package writes (`input_filter_kind`,
  `input_filter_meta_json`, `secrets_inheritance`,
  `inherited_secrets_json`, `secrets_override_reason`) and
  `listHandoffs(...)` round-trips them.

`pnpm test` — 83 new tests across the `@graphorin/sessions`
package covering: every public method of the `Session` facade and
the `SessionManager` (create / get / find / list / push / list /
search / compact / appendHandoff / listHandoffs /
handoffsByAgent / attachWorkflowRun / updateWorkflowRunStatus /
workflowRuns / close / fork / export / replay /
recordToolCassette / audit / pruneAudit); the AgentRegistry
lifecycle (register / retire / delete /
resolveOrPlaceholder, idempotent registration on duplicate
`id`, hydrate-from-store, snapshot, `assertExists` enforcement);
the BUILT_IN_COMMENTARY_PATTERNS catalogue + the
`createCommentarySanitizer({...})` policy matrix (wrap default,
strip opt-in, pass-through opt-in, idempotency on already-wrapped
content, bytes-equal across the four boundaries, per-part
sha256-before/after recording, system-message pass-through, mixed
text/non-text content); the JSONL session-export writer + reader
round-trip (sentinel header / footer, every record kind, body
checksum verification on `--hash`, lenient-forward-parse on
unknown record kinds, schema-too-new / schema-unsupported /
malformed-stream rejection, embedder-mismatch warning surfacing,
header-emitted-by-writer-only invariant); the cassette format
read / write round-trip + cursor-violation rejection +
malformed-stream rejection; the cassette decision engine's
per-`sideEffectClass` policy matrix (substitute pure / read-only;
re-execute side-effecting with INFO; re-execute external-stateful
with WARN-non-silenceable; honour the four `toolReplayMode`
overrides + per-tool overrides under `'mixed'`; idempotency-
mismatch detection with continue-with-recorded default vs
`failOnIdempotencyMismatch` opt-in throw); the cassette recorder
buffer + flush-to-disk + sha256 summary; the session replayer's
`replay.start / replay.end` markers, the
`ReplayAccessDeniedError` path on `canReadRaw: false`, and the
deterministic event-order property (cassette events emitted after
the trace-replay completes); the export migrator chain (registry
+ walking + cycle detection + idempotent registration); the
session export → import round-trip including `causalityChain`
preservation on `MessageContent` parts; and a dedicated
`tests/integration-sqlite.test.ts` suite that exercises the
production stack end-to-end against
`createSqliteStore({ path: ':memory:' })` — full session
lifecycle through `@graphorin/memory` + `@graphorin/store-sqlite`,
audit-row emission, anti-pattern enforcement (no
duplicate-`session_messages` table created by sessions package),
and the FTS5 ownership invariant. Adds dedicated suites for
reasoning-content round-trip (Anthropic-shaped `meta.signature` /
`meta.data` preserved bytes-equal through `Session.push / list /
export → import`), AES-256-GCM encryption helpers (key derivation
+ encrypt-then-decrypt round-trip + auth-tag corruption rejection),
cassette forward-parse on unknown record kinds, commentary
sanitization across all four session-output boundaries (push, list,
export-strip, replay-idempotent), per-session
`commentaryPolicy` override, replay audit-row emission for
requested + completed actions, sanitized-replay secret-content
drop, multi-fragment commentary, strip-policy edge case where the
content is entirely a leak signature, and a per-part sanitization
benchmark on a 100-part fixture (target < 2 ms p95; CI bound 5 ms
for noise tolerance). Coverage: 88.16 % statements, 70.02 %
branches, 88.67 % functions, 88.16 % lines — above the package's
`≥ 80 %` thresholds set per the Phase 11 acceptance criteria.

Workspace-wide: every other package's tests remain green;
`pnpm run check-no-network: PASS`; `pnpm run build` succeeds for
every package; `pnpm run typecheck` is green across all 14
packages.
