---
title: Changelog
description: "A rolled-up release-note feed for the framework. Per-package CHANGELOGs live in each `@graphorin/*` workspace."
editLink: false
---

<!--
  This page is auto-synced from /CHANGELOG.md on every documentation build.
  Do not edit it directly - change /CHANGELOG.md in the repository root.
-->

# Changelog

All notable changes to the Graphorin framework are documented in this
file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(pre-1.0: minor bumps may carry breaking changes; patch bumps do not).

Per-package changelogs live in each package's `CHANGELOG.md`.

> **Publication note.** Versions `0.1.0`-`0.4.0` were lockstep version
> milestones developed in the open; public npm publication of the
> `@graphorin` scope (with [Sigstore](https://www.sigstore.dev/) build
> provenance) begins with `0.5.0`.

---

## 0.12.0 - 2026-07-17

The **durable-approvals release** (PR #195): the top follow-ups from
the 2026-07-17 production-readiness review - a HITL park now outlives
the process that created it, and the server's network defaults close
the two soft spots the review flagged.

### Durable suspended agent runs - migration 038
(`@graphorin/agent`, `@graphorin/server`, `@graphorin/store-sqlite`)

- A run parked on durable HITL (`awaiting_approval`) **survives a
  server restart**: the `RunStateTracker` mirrors every park into the
  new `suspended_runs` sidecar (`store.suspendedRuns`), boot hydration
  re-registers persisted parks, and `POST /runs/:runId/resume`
  rehydrates them - the messenger's approve button keeps working after
  a redeploy.
- The `Agent` interface gains the codec behind it:
  `serializeState(state)` / `deserializeState(serialized)`
  (version-stamped `graphorin-run-state/x.y`, binary payloads through
  the wire projection, secret-named keys redacted at rest). Hand-rolled
  `Agent` implementations must add both methods; hand-rolled
  `ServerAgentLike` registry fixtures without them keep the previous
  in-memory behaviour and the resume endpoint answers an actionable
  `409 run-state-unavailable` (`500 run-state-invalid` for an
  unreadable durable payload).
- Rows drop when the run settles (resume completes or fails, or an
  explicit `POST /runs/:runId/abort`); the graceful-shutdown
  force-abort deliberately keeps them. `suspended_runs` is
  session-scoped, so the session hard-delete erasure cascade covers it.

### Server - secure network defaults (`@graphorin/server`)

- **BREAKING**: `metrics.requireAuth` now defaults to `true` -
  `GET /v1/metrics` requires the `admin:metrics:read` scope out of the
  box (the exposition leaks trigger ids and consolidator budgets).
  Give your Prometheus scrape job a bearer token or opt out explicitly
  with `metrics: { requireAuth: false }` for trusted networks.
- The server now states its TLS posture: it serves **plaintext HTTP
  only** (no in-process TLS by design). A non-loopback bind logs a
  startup WARN until the fronting reverse proxy is acknowledged with
  the new `server.tlsTerminatedUpstream: true` flag (records intent;
  changes no runtime behaviour).

### CLI - revocation propagation note (`@graphorin/cli`)

- `graphorin token revoke` / `token rotate` print the propagation
  window: the CLI writes the token store directly, so a running server
  may honor the old token for up to its verifier-cache TTL (default
  60s). Revoke via `DELETE /v1/tokens/:id` on the live server (evicts
  the cache synchronously) or restart it for immediate effect.

### Docs

- The README package table and architecture diagram catch up with the
  0.9.0 first publications: `@graphorin/channels` (Tier 3) and
  `@graphorin/proactive` (Tier 5) are listed, and the package count
  reads 29 everywhere.
- Deployment guide: a "TLS termination" section, the authenticated
  Prometheus scrape, and a `suspended_runs` row in the
  retention/growth table (self-clearing; deliberately no retention
  window - a park waits on a human).

## 0.11.0 - 2026-07-17

The **local-first first-run release** (PR #193): the remaining
engineering items from the 2026-07-16 external-audit plan, shipped as
one "will a local assistant run well on this machine?" story.

### CLI - `graphorin doctor --smoke-local` (`@graphorin/cli`)

- Six checks through the same code paths the framework uses at
  runtime: `smoke:native` (the `better-sqlite3` binding +
  `sqlite-vec`, with a pnpm-10 skipped-build install surfaced as the
  actionable `SqliteNativeBindingError` fix), `smoke:sqlite-roundtrip`
  (write / close / reopen / search, FTS-only - no models needed),
  `smoke:ollama` (daemon reachability; degrades to warn + skip),
  `smoke:ollama-models` (`--ollama-model` asserts presence),
  `smoke:embedding` (a real `/api/embed` probe reporting the
  dimension), and `smoke:chat` (a streamed tool-call round-trip
  through the real `ollamaAdapter`, `think: false`, reporting the
  server's load / prompt-eval / generation split).
- `--smoke-local` alone runs only the smoke; it composes with
  `--check-*` / `--all` and is deliberately not implied by `--all`.
- `@graphorin/cli` now depends on `@graphorin/provider`.

### Provider - Ollama server timings in events and traces
(`@graphorin/core`, `@graphorin/provider`)

- The `ProviderEvent` `finish` variant gains an optional
  `providerMetadata` field, mirroring
  `ProviderResponse.providerMetadata` for the streaming path.
- The Ollama adapter normalizes the server's nanosecond timing fields
  into the new `OllamaTimings` shape (`totalMs` / `loadMs` /
  `promptEvalMs` / `evalMs`) under `providerMetadata.ollama` on both
  the streamed `finish` event and `generate()` - a cold call dominated
  by model load no longer looks like slow generation.
- `withTracing` stamps numeric vendor diagnostics onto the provider
  span as `graphorin.provider.<vendor>.<key>` attributes (bounded,
  numbers only).
- `DEFAULT_OLLAMA_BASE_URL` is exported from the package barrel.

### Docs

- The providers guide gains a measured `qwen3:8b-q4_K_M` profile on
  Apple Silicon (M1 Max, 32 GB, Ollama 0.32.0): resident memory per
  `num_ctx`, cold vs warm load, the `num_ctx`-change re-load cost,
  generation speed, and the `think: true` wall-time impact - plus a
  practical settings block.
- The CLI guide documents the smoke with a real annotated run.

## 0.10.2 - 2026-07-17

The documentation-reconciliation tail of the 2026-07 end-to-end
campaign (PRs #188, #190, #191): small CLI contract fixes plus a sweep
that reconciled every remaining doc-drift item against the shipped
code.

- **CLI** (`@graphorin/cli`): `triggers prune` requires an explicit
  `--before` cutoff instead of silently no-opping (OPERATOR-01);
  `memory review --json` for scripted triage (MEMORY-CL-02);
  `secrets ref` threads `--secrets-source` / `--strict-secrets`
  (SECRETS-S-03/04); `guard --help` names all five tiers.
- **Provider** (`@graphorin/provider`): the OpenAI-compatible adapter
  sends structured output as `json_schema` (LIVE-EVAL-01).
- **Docs**: the agent-runtime filter table documents `bySensitivity` /
  `stripSensitiveOutputs` as the coarse `[REDACTED:...]`-token
  heuristics they are (AGENT-FIL-01/02/03); guide pages catch up with
  the MEMORY-C-03 behavior shipped in 0.10.1; the channels guide shows
  the real untrusted-content envelope attributes (`trust=` / `tool=` /
  `origin=`); the imperative-scan budget is documented as 250 ms, not
  5 ms (TOOLS-EX-02); the reconnect backoff and `ProtocolGuardConfig`
  docstrings match the implementation (ORPHAN-SU-02, LATERAL-L-03).

## 0.10.1 - 2026-07-16

The **e2e-remediation release**: closes the 2026-07 end-to-end
campaign over the released 0.9.0 / 0.10.0 line (PRs #184, #186, #187)
with 37 fixes - three criticals, the P1 batches, and the P2 tail.
Per-package details live in each package's `CHANGELOG.md`; observable
behavior changes are in the migration guide.

### Criticals

- **STORE-SQ-02**: session erasure crashed (and rolled back) in the
  default vec0 mode - the sidecar discovery scan matched vec0 SHADOW
  tables, whose DELETE rejection aborted the whole cascade. The
  GDPR-style erasure path works again, with a regression test on the
  real vec0 path.
- **MEMORY-C-01**: a working block written under a partial
  (NULL session/agent) scope could never be mutated a second time (the
  UNIQUE index treats NULLs as unequal); upserts now resolve rows
  NULL-safely.
- **WS-LIFECY-02**: graceful shutdown hung forever with a connected
  WebSocket client; `dispatcher.shutdown()` now closes sockets with
  the documented `4007` close code and `stop()` gains a drain-budget
  force-close.

### Agent, provider & cost

- **R-01**: `RunBudget.maxCostUsd` enforces - `withCostTracking`
  stamps the computed cost onto run usage (previously it only reached
  the `onUsage` hook, leaving the ceiling inert).
- **PROVIDER-CT-01**: tiktoken-backed counters no longer throw on
  special-token sequences such as `<|endoftext|>`.
- **PROVIDER-01**: cached reads bill at the input rate when the price
  entry has no cached-read rate (was billed at $0).
- **T3**: reasoning / local-adapter defect batch; **MODEL-FAL-01**:
  the gpt-4o family classifies correctly.
- **ORPHAN-SU-03**: concurrent OAuth `refresh()` calls share one
  rotation (one audit row / lifecycle event / rotation hook);
  **OAUTH-ADV-01/02**: DCR and device-authorization failures carry the
  RFC `error` / `error_description`.
- **LATERAL-L-01**: the default lateral-leak denial catalogue is no
  longer inert.

### Memory & sessions

- **MEMORY-C-02**: exact dedup works without an embedder (FTS
  fallback); **MEMORY-C-03**: the compaction default is gated on
  `providerContextWindow` - a bare `createMemory()` is off and silent
  instead of warning on every construction; **MEMORY-R-02**: a
  malformed fusion weight is coerced instead of crashing search;
  **BUFFER-N-01**: invalid consolidator trigger specs warn at
  construction.
- **SESSIONS-01**: session reads are scoped by `userId`.
- **SESSION-R-01/02/03**: session replay reproduces the run
  (routing-id sensitivity + internal minTier default), and a null
  cassette body throws a typed error.

### Server, workflow, security & tooling

- **TOKENS-RE-01**: `DELETE /v1/tokens/:id` invalidates the verifier
  LRU immediately (a warm token no longer authenticates for up to
  60 s); **SERVER-C-01**: workflow endpoints return the documented
  error envelope; **SERVER-CH-01**: a failed `start()` unwinds its
  daemons and `stop()` is a no-op afterwards; **SERVER-DO-01**:
  `/v1/health` surfaces the orphaned-trigger count.
- **WORKFLOW-01**: the timer driver re-arms at the earliest future
  wake; **TRIGGERS-01**: disabled triggers no longer fire via
  `emit()` / manual `fire()`.
- **SECRETS-S-01/S-02**: denied `ctx.secrets` access is audited, and
  `GRAPHORIN_MASTER_PASSPHRASE` activates the encrypted-file store
  from the CLI; **TOOL-AUDI-01**: the durable-HITL approval lifecycle
  is audited; **TOOL-AUDI-02**: audit export enforces mode 0600 on a
  pre-existing file; **TOOLS-EX-01/CHANNELS-01**: `bytesStripped` is
  never negative.
- **CORE-PRO-01**: RPC success frames require a `result` field;
  **OBS-PRIC-01**: `toOtlpEnvelope` is `@stable` and barrel-exported;
  **OBS-PRIC-02**: opt-in redaction patterns via `enabledPatterns`;
  **ORPHAN-SU-01**: OpenInference spans cover the insight tier and
  consolidate phases.
- **CLI**: the T8 batch (migrate strategy validation, offline revoke,
  read-only migrate guard); **CLI-01**: `token rotate` / `rekey` print
  the raw token to stdout (parity with `create`); **EVALS-REP-01**:
  the regression boundary is exclusive and float-robust.

## 0.10.0 - 2026-07-16

The **external-audit remediation release**: an independent consumer
audit of `0.9.0` (published packages + a repository clone, with both
an Anthropic and a local Ollama leg) confirmed the framework end to
end and pinned a P1 list on the local-model path and the
first-install experience. This release closes that list (PRs #181,
#182). Per-package details live in each package's `CHANGELOG.md`;
upgrade notes are in the migration guide.

### Provider - Ollama operational controls (`@graphorin/provider`)

- `ollamaAdapter` gains `think`
  (`false | true | 'low' | 'medium' | 'high'`, Ollama's top-level
  thinking field; a truthy value also defaults
  `capabilities.reasoning` to `true`), `numCtx` (sent as
  `options.num_ctx` on every request AND used as the default
  `capabilities.contextWindow`, so the server allocation, the declared
  capability and the memory compaction budget agree on one number),
  and `keepAlive` (Ollama's `keep_alive`).
- Streamed `message.thinking` chunks surface as `reasoning-delta`
  provider events (agent `reasoning.delta`) instead of being dropped.
- Honest `toolChoice`: `'none'` is enforced by withholding the tool
  catalogue, `'auto'` passes through, and a forced choice
  (`'required'` / `{ tool }`) throws the new
  `ProviderToolChoiceUnsupportedError` instead of silently degrading
  the contract to a suggestion - the native `/api/chat` API has no
  `tool_choice` field; the OpenAI-compatible adapter against
  `http://127.0.0.1:11434/v1` maps it.
- `providerOptions` with a nested `options` object merges into the
  built options block instead of clobbering `temperature` /
  `num_predict` / `num_ctx`.

### Store - actionable native-binding failure (`@graphorin/store-sqlite`)

- pnpm 10+ skips dependency build scripts unless approved, so a
  consumer install could look successful while `better-sqlite3`'s
  prebuilt binary was never downloaded - the first database open then
  died with a raw `bindings.js` stack. Both driver loaders (default
  and the cipher peer) now throw the typed `SqliteNativeBindingError`
  naming the exact fix (`pnpm.onlyBuiltDependencies` + reinstall); the
  cipher path previously misreported this case as a missing peer.

### Documentation & release tooling

- Installation guide: new "Native modules and pnpm 10" section with
  the `onlyBuiltDependencies` recipe; the quickstart starts
  warning-free and its real-local-LLM recipe shows the coherent
  context profile (`numCtx` + `providerContextWindow` +
  `JsTiktokenCounter`).
- Providers guide documents the new Ollama controls, the context-sync
  rationale, and the forced-`toolChoice` limitation with its
  workaround.
- New weekly consumer-install smoke replays the documented pnpm-10
  recipe against the published packages
  (`scripts/smoke-consumer.mjs`); the docs deploy gained a
  post-deploy version smoke; the security audit job moved from the
  retired npm classic audit endpoint to a pinned `osv-scanner`; every
  changesets-ignored workspace package now carries a seed
  `CHANGELOG.md` so the release automation cannot crash on a missing
  file.

## 0.9.0 - 2026-07-13

The **bot-adoption release**: five feature waves (PRs #170, #171,
#172, #176, #177) that turn the framework into a complete substrate
for a long-living personal assistant developed in a separate
repository - a channel front door, proactivity, a provable memory
quality loop, fine-grained permissions, and the workflow durability
tail. Two packages publish for the first time:
`@graphorin/channels` and `@graphorin/proactive`. Per-package details
live in each package's `CHANGELOG.md`; upgrade notes are in the
migration guide.

### Channels front door (new package `@graphorin/channels`)

- Vendor-neutral adapter SPI (`ChannelAdapter`, identity triple
  routing, capability flags), deterministic access policies
  (`pairing | allowlist | open | disabled`) with a persisted pairing
  store (migration 034), and a conformance testkit
  (`@graphorin/channels/testkit`) with an in-memory loopback adapter -
  a messenger adapter is written against the testkit, no vendor code
  ships in the framework.
- Inbound trust boundary: channel text enters through sanitization +
  a new `channel-inbound` trust class, seeds the run's taint ledger
  (`InboundTaintSeed`), and message-borne untrusted input arms the
  same data-flow policy tools do. Outbound `deliver()` cleans agent
  scaffolding through the shared commentary catalogue on every
  channel.
- Gateway daemons compose into the server lifecycle by structural
  typing (bounded inbound queues, health aggregation, activity
  signals); `SttAdapter` seam for voice transcripts (provenance
  `channel-inbound`).

### Proactivity (new package `@graphorin/proactive`)

- `createHeartbeat(...)`: checklist-driven quiet-hours-aware heartbeat
  on a cheap isolated profile; skips on empty checklists, defers while
  another run is active (`Agent.isBusy()`), strips sentinel replies.
- Durable cron leg: fresh session per fire with fail-closed model
  pinning (`pinnedProvider`) and a deterministic no-recursive-
  scheduling posture; composes with the workflow timer daemon.
- Escalation ladder `notify | question | review | act`: questions and
  reviews ride durable HITL (agent approvals or workflow awakeables,
  addressable through awakeable refs); `act` requires an explicit
  per-task grant AND a configured memory ingest gate - refused
  fail-closed otherwise. The server resume endpoint for agent HITL is
  real (the honest 501 retired).
- Scheduler guardrails (interval floor, per-task jitter, task limit,
  auto-expiry) and a run-level budget
  (`budget: { maxCostUsd, onExceed }`) enforced between steps.
- `scaffold: 'minimal'` agent preset: instructions-only prompt,
  defer-everything tool catalogue behind `tool_search`, no plan tool -
  the cheap posture for proactive fires.

### Memory quality loop

- Operation-level eval metrics: a HaluMem-format dataset loader,
  deterministic extraction recall/precision and update-omission
  scorers, a judged QA-hallucination scorer, and the
  `benchmarks/halumem` harness that replays cases through the REAL
  ingest path with a `--conflict-pipeline on|off` A/B - the
  reconcile path's value is now measurable, not asserted.
- Profile projection: the consolidator materializes a read-only,
  user-scoped `profile` working block from ACTIVE facts only (never
  quarantined or contested values), with fact-id provenance and an
  explicit erasure path (`WorkingMemory.purge`).
- Tool profiles `interactive | reviser | full` (interactive never
  constructs write tools), generalized curated-block passes
  (`consolidator.curatedBlocks`), and a `reviserConsolidatorPreset`
  for a cheap sleep-time revision agent.
- Closed promotion loop behind fail-closed gates: a pre-compaction
  `memoryFlushHook` salvages durable facts (quarantined, through the
  ingest gate), a persistent recall ledger (migration 036) counts
  distinct queries per fact, and the deterministic `PromotionPolicy`
  promotes only multi-signal evidence through the audited validate
  path. Enabling promotion or `autoPromoteExtraction` without an
  `ingestGate` now throws (`IngestGateRequiredError`). Opt-in
  `procedureInduction.auto` distils completed runs into quarantined
  procedures.
- Index hygiene: the embedder migration is resumable across processes
  (`graphorin memory migrate` is a real command: `--embedders`,
  `--batch-size`, `--reclaim`, `--json`), sqlite-vec absence can
  degrade to a linear-fallback KNN instead of failing, retired vector
  tables reclaim their space, and the chunking mode participates in
  the index version key.

### Permissions (four-value permissionDecision)

- Tool policy vocabulary widens to `allow | deny | ask | defer`
  (priority `deny > defer > ask > allow`; `'forbid'` stays as the
  alias of `'deny'`). `ask`/`defer` suspend the run durably exactly
  like `needsApproval` (`ToolApproval.mode`); `deny` blocks
  deterministically.
- Pre-tool `permissionHook`: one caller decision point over every
  executor-bound call, with schema-revalidated `updatedInput`
  rewrites that are what the approval record, policy and data-flow
  gates all see; rewrites of already-granted args are refused on
  resume replays.
- Deny-by-name removes a tool everywhere at once: the advertised
  catalogue, `tool_search` discovery/promotion, and execution
  (including inline handoff/sub-agent calls).
- Deferred decisions park as workflow approvals with a durable
  deadline (`requestApproval(name, payload, { timeoutAt })`); an
  unattended deadline auto-denies.

### Workflow durability tail

- `fork(threadId, checkpointId, { patch })` branches a thread with
  corrected channel values (JSON-safety re-checked); the fork route
  accepts the patch as `state`.
- Read-only thread inspection without the node graph
  (`readThreadState` / `listThreadCheckpoints`) and the operator CLI
  `graphorin workflow inspect|checkpoints`.
- The cross-process durability invariant is pinned end-to-end: a
  thread suspended on an approval in a SIGKILLed process resumes from
  SQLite in a fresh one.
- Code-mode runtime is a named seam (`CodeModeRunner` +
  `AgentConfig.codeMode { run, limits }`): substitute where
  model-written scripts execute; credentials, `RunState` and policy
  never cross the boundary.

### Foundations (wave A)

- Triggers: orphaned persisted triggers WARN + emit a typed event,
  register-time catch-up waits for `start()`, prune detects true
  orphans, and cron declarations accept an IANA `timezone` with a
  pinned DST policy.
- Consolidation: new `buffer:N` trigger ("consolidate once N tokens of
  unprocessed transcript accumulate") plus server-side activity
  signals that make `idle:T` a real debounce.
- Workflow deploy tail: `awaitExternal(name, { schema })` validates
  resolved payloads at delivery (invalid payload restores the
  suspension), awakeable addresses serialize for messenger callback
  data, and the server warns loudly when workflows are registered
  without a timer driver.

## 0.8.0 - 2026-07-11

The first **behavioral audit release**. A full end-to-end campaign ran
the framework the way consumers do - 33 scenarios across five tiers
(deterministic stub, live Ollama models, billed Anthropic API, Docker,
real network) - and adversarially confirmed 30 defects with file-level
root causes. This release fixes all of them; every fix carries a
regression test, and an independent re-validation pass re-ran every
original reproduction against the fixed tree (24/24 resolved, zero
regressions). Per-package details live in each package's
`CHANGELOG.md`; upgrade notes are in the migration guide.

### Memory (critical)

- **The conflict pipeline no longer destroys distinct facts under real
  embedders**: storage adapters return vector scores normalized to
  `(1 + cos) / 2`, but the three-zone thresholds stayed calibrated for
  raw cosine, so the NEAR-DUP zone fired at raw cosine `0.70` and
  nearly every distinct e5-family sentence pair silently deduped into
  the first written fact. Stage 2 (and Stage 5's reported
  `similarity`, hence `fact_conflicts.similarity`) now map store
  scores back to raw cosine at the pipeline boundary; regression tests
  run against the real sqlite-vec adapter, and the in-memory test
  fixture now models the production score contract so this class of
  drift cannot ship silently again.

### Server & client

- WebSocket subscribe replies now reach the wire **before** replayed
  frames, and the client buffers frames that arrive for a
  not-yet-mapped subscription - replayed events are no longer silently
  dropped on fresh subscribes and reconnect resumes.
- `/v1/metrics` mounts behind the auth boundary, so
  `metrics.requireAuth: true` works with `admin:metrics:read` (it was
  a permanent 401); `GET /v1/workflows/:id/state` answers 404
  `thread-not-found` for unknown/deleted threads instead of a plain
  500; `stop()` no longer closes caller-injected stores; `/v1/health`
  clamps `walSizeBytes` to 0 off WAL mode.
- The client's workflow subscription target gains an optional `runId`
  to subscribe to the run-scoped subjects the execute/resume routes
  advertise - previously workflow run events were unreachable through
  `GraphorinClient`.

### Local model stack

- `@graphorin/reranker-transformersjs` works out of the box: the
  default dtype is device-aware (`q8` on CPU - the fp16 ONNX exports
  fail session init there) and real scoring reads raw model logits
  (sigmoid / positive-label softmax) instead of the
  text-classification pipeline, whose softmax collapsed single-logit
  BGE rerankers to a constant `1.0` (reranking was a no-op). A
  network-gated regression test pins the real default model.

### CLI

- `tools lint` honours its exit-2 contract (broken `--config` no
  longer silently passes with the default glob) and its globstar
  matches zero directories; `triggers status/fire/disable/prune` run
  with migrationPolicy `check` and refuse to auto-migrate a
  behind-schema database (W-068); `skills migrate-frontmatter` dry-run
  lists what `--apply` would rewrite; `storage status` probes the
  cipher peer through the encrypted sub-pack (agreeing with what
  `encrypt`/`rekey` can do); `storage backup` mirrors the source file
  mode; `doctor` gains `--config <path>`; `init` gains
  `--format ts|json`; `audit verify` honours `--json` on the error
  path. **Behavior change**: `token create` prints the raw token to
  stdout (log chatter stays on stderr), so
  `TOKEN=$(graphorin token create ...)` works.

### Security & integrations

- The worker-threads sandbox settles (`execution-failed`) when a
  worker exits 0 without producing a result, instead of hanging the
  run; the Docker sandbox demuxes multiplexed container logs (the
  live path failed every run).
- The 1Password resolver classifies the op CLI v2 signed-out message;
  the `@graphorin/mcp` OAuth helpers accept and forward
  `secretsStore` (refresh/revoke can actually succeed across
  processes), and the authorization provider no longer burns a
  refresh rotation on its first `resolveHeader()`.
- The bundled Anthropic Skills spec snapshot matches the live
  six-field upstream spec; `graphorin-disable-model-invocation` is
  retagged as a Graphorin-only extension.

### Observability, evals, pricing

- Replay sensitivity decisions are identical across trace sources:
  exporters serialize `sensitivityByAttribute` (spans and events) and
  prune entries for stripped attributes.
- `runEvals` gains `agentFactory` (one agent per worker) - the
  supported way to run framework agents at `concurrency > 1` - and a
  shared instance tripping the concurrent-run guard fails fast with
  `EvalConcurrencyError` instead of masquerading as scorer failures.
- `pricing refresh` accepts the live genai-prices bare-array
  `data.json`; `pricing lookup --json` serializes rates as clean
  decimals; `@graphorin/provider` exports `listMiddlewareKinds`.

### Examples & repo hygiene

- The flagship local examples (`local-stack-cli`,
  `personal-assistant-cli`) now genuinely persist and recall memory
  (per-turn session writes, consolidator turn triggers with
  auto-promotion, memory tools, context assembly, loopback provider
  trust) - their READMEs were true in spirit and are now true in
  fact; `slack-bot-integration` binds a real HTTP listener; the
  startup rule seeding is idempotent.
- The turbo `test` task depends on the package's own `build` (fixes a
  dist race under forced runs); the docs went through a seven-cluster
  verification sweep against the fixed tree (33 drift fixes, from a
  stale changelog mirror to a nonexistent systemd `ExecStart` path).

---

## 0.7.0 - 2026-07-07

The third framework-wide **remediation release** - all six waves of the
2026-07-05 project review of v0.6.1 (157 findings, a 151-work-item plan
across 16 clusters). Headlines: durable HITL now composes across the
sub-agent boundary, workflow timers fire on their own, session
hard-delete erases everything session-scoped, the server prunes derived
data by default, CommonJS consumers can plain `require()` every package
(Node floor 22.12), and zod 4 consumers typecheck. Per-package details
live in each package's `CHANGELOG.md`; upgrade notes are in the
migration guide (`documentation/guide/migration.md`).

### Security & data flow

- **Untrusted-content envelopes can no longer be spoofed or escaped**:
  `wrapEnvelope` neutralizes embedded `<<<untrusted_content>>>`
  delimiters, the memory consolidation + compaction prompts delimit
  stored memory text as data the same way, a new
  `untrusted-content-delimiter-injection` redaction pattern turns
  break-out attempts into an audit signal, and MCP `isError` text plus
  tool-schema annotations (the tool-poisoning class) are sanitized at
  the boundary.
- **The Rule-of-Two `untrustedInput` leg is actually enforced** (a
  profile that gives the leg up now forbids untrusted-source tools),
  the dataflow sink gate inspects post-repair arguments, spill handles
  are run-scoped with taint sidecars unreadable through `read_result`,
  cross-page imperative payloads are caught at spill time, and
  `containsPii` sees through Unicode obfuscation.
- **Server auth is attenuation-only and symmetric**: `POST /v1/tokens`
  refuses to mint scopes the minter's own grant does not cover;
  session REST/SSE reads honour per-resource scopes; run control binds
  to the run's owning agent/workflow; a malformed `/stream` body
  answers 400 instead of silently burning tokens; WS replay frames
  pass the same sanitizer as live delivery.
- **Audit chain**: cross-process fencing for append + prune, the
  `audit.cipher` setting is finally honoured (default pinned
  `chacha20`), `pruneAudit` survives the real driver and prompts
  re-anchoring, the skill trust root's `publishers` leg is
  cryptographically bound to the key-serving domain, and
  security-relevant tool events flow into the tamper-evident audit
  log by default (`audit.toolEvents`).

### Memory pipeline

- **Consolidation stops silently losing facts**: truncated
  (`finishReason: 'length'`) extractions split-and-retry or salvage
  the complete prefix, over-budget transcripts split before the
  provider call, a poison slice can no longer wedge the cursor forever
  (bounded skip), DLQ slice-capture is per-scope, and completion
  accounting is exception-safe (no more stuck scope locks).
- **Supersede keeps knowledge visible**: while a quarantined successor
  awaits validation the old fact stays recall-visible; quarantined
  insights no longer pass-decay before review; compaction
  summary-trust fails closed on scanner timeout.
- **Retrieval**: construction-time `searchDefaults` bring the advanced
  stack (multi-query, HyDE, graph expansion, fusion tuning) to
  `fact_search`, auto-recall and `deep_recall`; the trust discount
  applies before the final top-k cut; HyDE honours
  `includeSuperseded`/`owner`; multi-query fan-out embeds in one
  batch; the iterative-retrieval difficulty gate is tunable.
- **Scope-guarded mutators**: `forget`, `setStatus`, `archive`,
  `purge` and `markAccessed` accept a scope and no-op on foreign ids,
  symmetric with the read-side isolation.

### Workflow durability

- **Durable timers fire without user polling code**: suspended
  checkpoints carry `wakeAt` (migration 032), `createTimerDriver`
  ticks due threads, and the server binds it as a lifecycle daemon
  reported on `/v1/health`.
- **Replay is safer**: positional `pause()` replay detects divergence
  (typed `pause-replay-divergence`), the JSON-safety gate covers
  pause / approval / `Dispatch` / directive values, `maxSteps` caps
  per invocation (with an opt-in `maxTotalSteps` lifetime quota), and
  the docs stop calling side effects exactly-once (journaled channel
  writes replay once; effects are at-least-once).
- **The HTTP workflow surface exposes every durable primitive**: named
  awakeable `resume`, `retry`, `tick`, a real `fork`, per-thread
  `deleteThread` erasure, and machine-readable failure `code`s on the
  wire.

### Agent runtime & HITL

- **Durable HITL composes across the sub-agent boundary**: a handoff
  or `toTool` child suspending on an approval-gated tool parks on the
  parent (`RunState.pendingSubRuns`) instead of failing the run;
  decisions route on a composite key, the granted call executes
  exactly once, and nested parks recurse - serialized snapshots carry
  children version-stamped and secret-redacted.
- Delegated usage folds into the parent's accounting,
  `currentAgentId` is restored after a handoff, step numbers stay
  monotonic across suspend/resume, and the `onPendingApprovals` abort
  policy is reachable and consistent (`'fail'` only when approvals are
  actually pending).
- **One trace tree with child transparency**: the new `subagent.event`
  forwards child lifecycle events per `forwardEvents`, and
  handoff/`toTool` runs parent under the live step span.
- **Thinking-block signatures round-trip** (new `reasoning-end`
  provider event), so multi-step tool use with Anthropic extended
  thinking replays each block byte-equal; `RunContext.state` becomes a
  read-only projection; `AnyTool` and the exported `HandoffEntry` end
  the collection-seam casts.

### Storage & retention

- **The server prunes derived data by default**: a unified retention
  sweep (every 6 hours) deletes spans (30 d), consolidator run
  counters (90 d), exhausted DLQ batches (30 d) and expired
  idempotency records; primary content (sessions, audit, memory
  history, workflow threads) stays strictly opt-in;
  `retention: { enabled: false }` disables it.
- **Hard-delete means hard-delete**: session deletion erases every
  session-scoped surface via the schema-gated `SESSION_SCOPED_PURGES`
  registry (facts, insights, spans, working blocks) plus
  suspended-run checkpoints (migration 029).
- **Reachable retention levers**: `pruneSpans` and a real
  `graphorin traces prune` (previously a no-op against a phantom
  table), `graphorin memory prune-history`, checkpoint
  `pruneThreads`/`compactThread`, an opt-in agent
  `checkpointPolicy: 'delete-on-terminal'`, consolidator
  `dlq-list`/`dlq-clear`, and `graphorin storage compact` (incremental
  vacuum, FTS-safe).
- **Concurrency + integrity**: a migration-runner TOCTOU fence,
  read-only CLI commands stop auto-migrating live databases, a
  data-repair preflight on migration 022, typed `SqliteBusyError`,
  `encryptDatabase({ swap: true })` refuses under a live writer,
  `Float32Array` views serialize correctly, and `rules_fts` joins the
  FTS integrity guard. The schema advances to migration 032.

### MCP & tools

- **MCP server identity is transport-derived** - a server renaming
  itself can no longer mint fresh TOFU pins or claim a trusted handle
  scope; the pin lifecycle covers post-approval tool additions
  (rejected by default; `'accept-and-update'` for legitimate catalogue
  changes); the new `createManagedMCPClient` survives dead transports
  and re-screens the catalogue on reconnect.
- The ReDoS guard rejects the alternation-overlap family, SDK error
  classification is code-based (server-controlled text cannot forge
  timeout/cancel classes), and operator side-effect-class downgrades
  are visible (WARN + `downgradedTools`).
- **Executor honesty**: an inline timeout actually aborts the tool
  (and stops inviting unsafe retries of side-effecting calls), the
  `ToolReturn` envelope gains a symbol brand (extra result fields
  reach the model instead of being silently stripped), auto-prefix
  collision losers are always renamed or observably suppressed,
  streaming aggregation is bounded (8 MiB default), and tool
  discovery/grading is comment-aware.
- Tools/MCP counters land on `/v1/metrics` as Prometheus series.

### Provider adapters, pricing & observability

- **Streaming provider errors join the canonical taxonomy**: a
  pre-content 429/500/529 throws a typed retryable `ProviderHttpError`
  (retry and fallback finally engage on streaming steps); a mid-stream
  error classifies and finishes as `finishReason: 'error'`.
- Local adapters put images on the wire (`capabilities.multimodal`)
  and warn instead of silently dropping parts; `llamaCppNodeAdapter`
  speaks real chat history with an opt-in persistent session;
  `withRateLimit` gains a `tokensPerMinute` budget.
- `graphorin pricing refresh` works against the published
  `@pydantic/genai-prices` dataset, the `Cost.amount` units contract
  is pinned (whole currency units), and `CostTracker` tracks
  prompt-cache legs under bounded memory.
- Per-type sampling rules finally thin child spans, span events carry
  sensitivity tiers (`recordException` exports `exception.type`), and
  the phantom `@opentelemetry/*` peers are gone - with them the
  `ERESOLVE` trap of the stale caret pins.

### Server, wire & clients

- **Binary payloads survive the wire**: run-state schema 1.2 with
  `WireRunState`/`WireMessage` codecs (an image in a run checkpointed
  at `awaiting_approval` no longer corrupts on resume) and JSON-safe
  `WireAgentEvent` projections on the server WS path.
- The WS replay buffer is TTL-pruned (memory-leak fix), the client's
  per-subscription queue is bounded (typed `flow-overflow`), and a
  WS-to-SSE fallback closes unresumable subscriptions
  deterministically instead of hanging them.

### CLI

- `--json` mode honours exit codes (a broken audit hash chain no
  longer exits 0), `graphorin init` stops printing a dead bootstrap
  token and walks the real pepper -> `migrate` -> `token create` path
  (stdin, never argv), help text stops promising unimplemented
  persistence, and the `check-cli-docs` gate now validates required
  options.

### Packaging, types & release pipeline

- **Node floor 22.12; CommonJS consumers can plain `require()` every
  package** - export maps moved from the `import` condition to
  `default` (stable `require(esm)`), gated by attw `node16` and a
  require-smoke against packed tarballs.
- **zod ^4 actually typechecks** at `skipLibCheck: false` (the
  `ZodLikeError` shim widens to `PropertyKey`; shipped d.ts no longer
  bake concrete zod v3 generics). Phantom workspace dependencies are
  removed, every package declares `sideEffects`, tarballs ship `src/`
  so declaration maps resolve, and the server's sibling peer floors
  track the current minor.
- The core public API is snapshot-gated (api-extractor report + CI
  gate), and publishing moves to **npm trusted publishing (OIDC)** -
  no long-lived registry token; Sigstore provenance rides the same
  workflow identity.

### Documentation, evals & examples

- LOCOMO / LongMemEval loader fidelity (speaker names rendered,
  numeric reference answers kept, empty-reference questions skipped),
  a TSDoc `{@link}` sweep behind a validation gate, honesty fixes
  across READMEs and guides (WorkerPool, HITL event shapes, journal
  semantics, retention stories), and friendlier lint:
  `no-implicit-network-call` scopes to `@graphorin/` packages by
  default and `no-secret-unwrap` gains an `allowReceiverPattern`
  escape for Zod's `.unwrap()`.
- Doc gates go deny-by-default: snippet typechecking auto-discovers
  every page, a character-rules gate pins ASCII punctuation,
  `llms.txt` is compact again (the API index moves to `llms-api.txt`),
  and the examples' run-direct guard works on Windows.

## 0.6.1 - 2026-07-05

Patch release.

### Fixed

- **observability**: the default-on `graphorin-token` redaction pattern was
  hardcoded to a stale `kru_` token shape and never matched real framework
  tokens; it now matches the actual `gph_<env>_v1_<entropy>_<crc32>` format
  (deployments with a custom token prefix must register their own pattern).

### Changed

- **all packages**: version constants and version-bearing strings (writer
  ids, client/server info, OTLP attributes, the build-info metric) now derive
  from each package's manifest at build time; rendered values are
  byte-identical at this version. Release bumps no longer edit source, the
  remaining text surface is rewritten by `pnpm run bump-version -- --sync`,
  and the new `check-version-consistency` CI gate fails any reintroduced
  hardcoded framework version.

## 0.6.0 - 2026-07-05

The second framework-wide **audit release** - waves A-E of the 2026-07-04
audit (220 findings) - plus a full documentation accuracy + character-rules
sweep. Per-package details live in each package's `CHANGELOG.md`; upgrade
notes are in the migration guide (`documentation/guide/migration.md`).

### Security & correctness (waves A-B)

- Tool parameters are **real JSON Schema on the provider wire**: a structural
  Zod v3/v4 converter (`@graphorin/tools/schema`) replaces serialized
  validator internals; unprojectable schemas degrade loudly.
- **Durable HITL resume is exactly-once**: an approved call's resume writes a
  write-ahead intent checkpoint before dispatch and the journaled state after
  it; stale pre-execution snapshots stay bounded at one re-execution.
- Transcript well-formedness invariant in the step builder, hook-level
  `allowSensitivity`, session `purge()` cascade, `disableRepair`,
  `prefixMessages` token basis, spill-file taint sidecars,
  superseded-facts-excluded-by-default reads, an emergency compaction tier,
  IMMEDIATE SQLite transactions + an online backup API, MCP result-handle
  scoping + ReDoS guards, and the `ai` v7 provider-contract conversion.

### SOTA adopts (wave C)

- **Prompt-cache economics end-to-end**: `Usage` cache read/write legs, the
  opt-in `cachePolicy` breakpoint anchors, a cache-friendly tool catalogue,
  and cache-aware cost tracking over a regenerated pricing snapshot.
- Recoverable tool-error envelope + transparent bounded retry, the verifier
  seam, deterministic replay (`recordProviderResponses` +
  `createReplayProvider`), compaction hardening (`preserveUserMessages`),
  trust-aware recall ranking + `fitFusionWeights`, derived-taint `'strict'`
  mode with recall re-arm and MCP TOFU pinning, one-trace-tree `agent.run` /
  `agent.step` spans, and eval A/B switches with a non-self judge.

### Durable runtime (wave D)

- **Step-journal workflow durability**: durable timers, awakeables,
  approvals, and compare-and-set checkpoint writes
  (`CheckpointStore.put({ expectedLatestId })`); the `'async'` durability
  source is removed.
- Sub-agent isolation (read-only capability, `contextFold`, taint
  propagation), memory learned-context / owner / access-counters / runbooks
  (migrations 026-028), Merkle audit checkpoints + a skill-signing trust
  root + Progent / Rule-of-Two argument policies, and PPR-lite graph
  retrieval with entity-match fusion.

### Cross-cutting (wave E)

- **A ~2000x graph-CTE query-plan fix** in the SQLite store's entity
  expansion, found by the new 100k-fact scale probe (`benchmarks/scale`);
  the latency and memory-sim benchmark gates are armed for real.
- Release pipeline: the changesets 1.0.0 peer-escalation landmine defused
  (ranged internal peers + `onlyUpdatePeerDependentsWhenOutOfRange` +
  private-package ignore), tarball surface fixes (`@graphorin/memory`
  `./conflict` runtime-empty subpath, per-package CHANGELOG backfill),
  stricter `mvp-readiness` release gates.
- Supply chain + CI: SHA-256-pinned eval datasets (`scripts/datasets.lock.json`),
  failure notifications for scheduled workflows, job timeouts everywhere.
- Deployment templates fixed against reality (kubectl YAML-1.1 octal
  `defaultMode`, systemd `ExecReload` removal, docker config/secrets
  mounts), the Windows `storage cleanup-backups` no-op fixed, OTel GenAI
  span-name alignment, and eval statistics (Wilson intervals, pass^k,
  McNemar paired significance) attached to every eval summary.

### Documentation

- Every authored page re-verified against the code: 40 confirmed drift
  fixes (fictional `calculateCost` examples, health-check shapes,
  session-export record kinds, redaction-pattern catalogue, deployment
  template claims, and more), with the doc gates extended so the drift
  class cannot silently recur (28 compile-checked snippets, CLI-docs
  flag validation, anchor-checking lychee in offline file mode).
- A character-rules sweep across all markdown, TSDoc, and user-facing
  strings (ASCII punctuation only), and a new Performance & scale guide
  (`documentation/guide/performance.md`) with measured 100k-fact numbers.

## 0.5.0 - 2026-06-14

A framework-wide **audit-remediation** release - waves 0-4 of a 301-finding
security + correctness audit - plus SOTA adopts across memory, tools, and the
agent runtime. This is the **first release published to the npm registry**.

### Security & correctness

- Closed actively-exploitable holes: code-mode `process.env` exfiltration, the model-driven memory-quarantine bypass, object tool-outputs bypassing truncation + inbound sanitization, the encrypted-secrets-store silent data-loss path, the concurrent-`appendAudit` race, the GDPR `purge()` FK failure, idempotency-replay scope bypass, and per-IP rate-limit spoofing.
- Fail-loud over silent corruption: secrets/audit write paths, provider retry + fallback on network errors, and four trigger-scheduler bugs (spurious catch-up, interval double-fire, error-death, long-horizon `setTimeout` overflow).

### Completed core mechanisms

- Durable HITL resume now executes an approved tool exactly once; workflow crash-recovery + frontier persistence; `ContextEngine.assemble()`, guardrails, structured `outputType`, and the previously-inert `AgentConfig` fields are wired or removed.
- Memory: tokenized FTS recall, honest metadata counts, server-wired background consolidation, real sliding-window cost budgets, and a quarantine promotion path.
- Streaming server end-to-end (SSE / WebSocket), config-driven storage encryption, provider request timeouts + JSON-mode, and the Vercel AI SDK v7 chunk shapes.

### SOTA adopts (eval-gated)

- Compaction clearing-tier with recoverable `read_result` handles + reclaim-floor and Errors/Next-steps summary sections; the FIDES data-flow lattice; prompt-cache-aware tool catalogue with worked tool-use examples and end-to-end structured output; step-journal exactly-once resume; OpenTelemetry GenAI span mapping.

### Hardening & honesty (wave 4)

- Obfuscation-resistant taint detection, opt-in deny-wins supply-chain precedence, audit-prune + 1Password-CLI-timeout fixes, all-occurrence / cross-delta redaction, a cross-embedder entity-resolution guard, revived no-network guard coverage, and a documented security **Known limitations** section.

## 0.4.0 - 2026-05-26

The **memory program** (P0-1 … P2-2) - a research-grade rebuild of
`@graphorin/memory`.

### Added

- **Temporal memory** - bitemporal `as_of` reads and a `fact_history` tool (migration 013).
- **Injection defense** - provenance + quarantine on extracted facts, an agent-callable `fact_validate` promotion gate, and offline injection heuristics.
- **Consolidation** - neighbour-aware extract→reconcile, auto-importance + episode formation, and deep-phase reflection that synthesises read-only **insights** (migration 014).
- **Retrieval** - contextual retrieval with late-chunking (default), query transformation (multi-query / RAG-Fusion + opt-in HyDE), weighted/convex fusion, an in-SQLite **entity graph** with one-hop expansion (migrations 015-016), agentic/iterative retrieval (`deep_recall`), and **procedural memory** induction (migration 017).
- **Hygiene** - multi-signal forgetting / capacity-bounded eviction, and recall introspection (`graphorin memory inspect` / `activity`).
- An offline-first **eval harness** (`@graphorin/evals`) with LongMemEval / LOCOMO loaders.

## 0.3.0 - 2026-05-24

**Tools & harness** end-to-end (WI-01 … WI-13).

### Added

- **Defer-loading tool catalogue** - large tool sets are summarised; full schemas load on demand through a Tool Search seam.
- **Spill-to-handle results** - oversized tool outputs spill to a handle re-fetchable via `read_result`, bounding context growth.
- **Code-mode execution** - the model can drive tools through a sandboxed code API instead of one call per step.
- **Deterministic dataflow / taint policy** - opt-in `dataFlowPolicy: 'shadow' | 'enforce'` gates untrusted-to-sink flows and the lethal trifecta at `executeOne`.
- **MCP surface completion** - `resource_link` → handles, gated elicitation / sampling hooks, and composable result readers.

## 0.2.0 - 2026-05-21

A hardening / quick-wins maintenance release driven by an internal
action-item audit: dependency and supply-chain hygiene, CI tightening,
and assorted correctness fixes across the runtime and tooling.

## 0.1.0 - 2026-05-09

The first tagged version of the Graphorin framework. All `@graphorin/*`
packages are versioned together at `0.1.0` (lockstep on the `0.x`
line).

### Added

#### Runtime, memory, workflow

- `@graphorin/agent` - agent runtime with streaming events, steering /
  follow-up queues, `prepareStep` hook, HITL durable resume, multi-agent
  handoffs (`Agent.toTool({ secretsInheritance })`), composable stop
  conditions, fan-out + evaluator-optimizer loops, structured-handoff
  artifacts.
- `@graphorin/memory` - six-tier memory: working / session / episodic /
  semantic (bi-temporal default-on) / procedural / shared. Multi-stage
  conflict resolution (exact dedup → embedding three-zone → heuristic
  regex → subject/predicate). Hybrid search with Reciprocal Rank Fusion
  default. Memory-aware system prompt with built-in English locale pack
  and a pluggable per-locale extension point. Background consolidator
  with `light` + `standard` + minimum-viable `deep` phases, mandatory
  noise filter, lock-then-defer policy, idempotency cursor, dead-letter
  queue, and a default `tier: 'free'` cost budget.
- `@graphorin/workflow` - durable step-graph runtime with a
  synchronous-step model, in-memory channels (`LatestValue`, `Reducer`,
  `Stream`, `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate`),
  `pause` (HITL) / `resume`, four stream modes (`values` / `updates` /
  `tasks` / `debug`), `Directive` and `Dispatch` primitives.
- `@graphorin/sessions` - hybrid session facade with the agent registry,
  handoff records, JSONL export schema 1.0, and replay reconstruction.
  Session messages are owned by `@graphorin/memory` (single source of
  truth, DEC-147).

#### External surface

- `@graphorin/tools` - typed tool registry, parallel execution,
  `needsApproval` flow, sandboxed execution, four-strategy result
  truncation pipeline, streaming-tool execution surface, built-in
  `tool_search` lookup tool.
- `@graphorin/skills` - Anthropic Agent Skills format compatible loader
  with `graphorin-*` namespaced extensions; ed25519 signature
  verification on install (DEC-140 / ADR-034); slash commands
  (`/skill:name`); progressive-disclosure activation; sandbox-tier-aware
  execution.
- `@graphorin/mcp` - Model Context Protocol client (stdio +
  Streamable HTTP + legacy SSE); typed `MCPClient`; `toTools()` adapter
  with inbound prompt-injection sanitization, deferred-loading auto-default,
  structured-content + outputSchema round-trip, per-server priority and
  collision strategy; pluggable `EventStore` for resumable sessions;
  OAuth bridge backed by `@graphorin/security/oauth`.

#### Persistence + provider

- `@graphorin/store-sqlite` - default storage adapter on top of
  `better-sqlite3@^12.9.0` + `sqlite-vec@~0.1.9` + FTS5 with
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'`. WAL hardening
  pragmas, WorkerPool wrapper for the standalone server.
- `@graphorin/embedder-transformersjs` - default in-process embedder
  (`Xenova/multilingual-e5-base`, multilingual). WebGPU when available.
- `@graphorin/embedder-ollama` - first-class opt-in alternative against
  an Ollama daemon (`nomic-embed-text` default, multi-model support).
- `@graphorin/triggers` - cron / interval / idle / event triggers; same
  code path in library and standalone-server modes (DEC-150).
- `@graphorin/provider` - vendor-neutral `Provider` interface; default
  `vercelAdapter` wrapping the Vercel AI SDK (v7 beta); `ollamaAdapter`,
  `llamaCppServerAdapter`, and `openAICompatibleAdapter` for local LLMs;
  shared `LocalProviderTrust` classifier; provider middleware composer
  with enforced ordering (DEC-145 / ADR-039) - `withRedaction` is
  mandatory innermost.
- `@graphorin/provider-llamacpp-node` - companion package for
  in-process GGUF execution via `node-llama-cpp@^3.5`.

#### Cross-cutting infrastructure

- `@graphorin/security` - `SecretValue` wrapper end-to-end with
  leakage barriers; `SecretRef` URI scheme (`env:` / `keyring:` /
  `file:` / `encrypted-file:` / `op://` / `vault://` / `ref:`);
  `KeyringSecretsStore` default via `@napi-rs/keyring`; sandbox tiers
  (`worker-threads` default + `docker` + `isolated-vm` + `none`);
  memory-modification guard (xxhash-fingerprint hash chain);
  HMAC-SHA256 + pepper server-token auth (DEC-122 / ADR-027);
  encrypted `audit.db` with SHA-256 hash chain; OAuth flows via
  `openid-client@^6.x`; ed25519 skill-signature verifier; process
  hardening (umask, refuse-root, file-mode policy).
- `@graphorin/observability` - OpenTelemetry tracer with GenAI Semantic
  Conventions; typed `AISpan<SpanType>`; `ConsoleExporter` /
  `JSONLExporter` / `OTLPHttpExporter` with mandatory
  `RedactionValidator` (default-deny non-public, DEC-141 / ADR-035).
  Eval interfaces only; the full eval framework ships in
  `@graphorin/evals`.
- `@graphorin/pricing` - separate package; bundled
  `@pydantic/genai-prices` snapshot; `graphorin pricing refresh`
  opt-in (never invoked automatically).

#### Standalone runtime

- `@graphorin/server` - optional REST + WebSocket + SSE runtime built
  on Hono. REST `Idempotency-Key` per IETF draft-07 (DEC-142 /
  ADR-036), durable HITL across process restarts, lifecycle hooks,
  triggers daemon, consolidator daemon, replay endpoints, `/v1/health`
  + `/v1/metrics` (Prometheus, opt-in auth), audit verify endpoint.
- `@graphorin/cli` - operator CLI binary (`graphorin start | init |
  migrate | doctor | token | secrets | storage | audit | memory |
  consolidator | triggers | auth | pricing | skills | traces |
  migrate-export | guard | telemetry`).
- `@graphorin/protocol` - browser-friendly schemas for the WebSocket
  protocol contract `graphorin.protocol.v1` (DEC-127 / ADR-031).
- `@graphorin/client` - browser-friendly TypeScript client for the
  standalone server.

#### Optional sub-packs

- `@graphorin/store-sqlite-encrypted` - SQLCipher v4 encryption-at-rest
  via `better-sqlite3-multiple-ciphers@^12.9.0` (DEC-129 / ADR-030).
  Required for the always-encrypted `audit.db` on fresh installations.
- `@graphorin/secret-1password` - reference `SecretResolver` for
  `op://` URIs through the 1Password CLI.
- `@graphorin/reranker-transformersjs` - pluggable cross-encoder
  reranker on top of `@huggingface/transformers`.
- `@graphorin/reranker-llm` - pluggable LLM-judge reranker.
- `@graphorin/eslint-plugin` - ESLint rules for projects that build
  on Graphorin (`no-secret-unwrap`, `no-secret-in-deps`,
  `provider-middleware-order`, `no-implicit-network-call`,
  `no-third-party-workflow-aliases`, `no-bare-tool-exec`,
  tool-discovery surface).
- `@graphorin/evals` - full evaluation framework (scorers, datasets,
  runner, reporters; decoupled from `@graphorin/observability` per
  RB-17 / DEC-152).

### Privacy and security baselines

- **Zero default telemetry** (DEC-154 / ADR-041). The framework
  generates no outbound network call you did not initiate. The CI
  workflow `check-no-network.yml` enforces this against the source
  tree on every push and pull request.
- **Sigstore build provenance** on every published package
  (`publishConfig.provenance: true` + `npm provenance` on the GitHub
  Actions release workflow).
- **Pre-launch security audit** completed against the project's STRIDE
  threat model and the OWASP LLM Top 10 (2025): 0 Critical, 0 High
  findings; Medium / Low findings documented with v0.2 owners.

### Examples

The repository ships eight example apps:

- `personal-assistant-cli` - single-agent local CLI (library mode,
  hello-world target).
- `slack-bot-integration` - server mode + WebSocket + durable HITL
  approvals across server restart.
- `background-consolidator` - server mode + cron triggers + light /
  standard consolidator phases.
- `multi-agent-crew` - supervisor + 2 worker agents (RB-33 acceptance
  scenario).
- `approval-workflow` - `@graphorin/workflow` HITL durable resume via
  `pause()` / `Directive(resume)` across server restart.
- `document-pipeline` - `@graphorin/workflow` `Dispatch` + parallel
  nodes + every channel type.
- `three-agent-harness` - Planner / Generator / Evaluator harness
  with structured-handoff artifacts; `Agent.fanOut(...)` +
  `evaluatorOptimizer(...)` (RB-50 reference).
- `local-stack-cli` - fully local stack (Ollama LLM + Ollama
  embeddings + SQLite + sqlite-vec, no cloud calls).

Distribution templates: `docker/`, `k8s/`, `systemd/`, `github-actions/`.

### Benchmarks

- `benchmarks/locomo` - LoCoMo benchmark runner (10 conversations,
  200 questions); per-question accuracy + per-conversation aggregates
  + cost summary.
- `benchmarks/locomo-multilingual` - community-contribution hooks for
  per-locale subsets.
- `benchmarks/dialogue-smoke` - dialogue smoke test (wiring check; not
  the published DialSim benchmark).
- `benchmarks/memory-sim` - synthetic-dialogue memory simulator.
- `benchmarks/latency` - p50 / p95 FTS memory-search latency probe.
- `benchmarks/cost` - per-conversation token-cost regression suite
  (CI budget assertion, must not increase > 10 % between runs).

### Documentation

- Per-package `README.md` covers the public surface, configuration,
  and dependency footprint.
- `SECURITY.md` documents the disclosure process, supported versions,
  cryptographic baselines, and the privacy promise.
- `CONTRIBUTING.md` covers the development workflow, conventions, and
  commit format.
- `CODE_OF_CONDUCT.md` reproduces the unmodified Contributor Covenant
  v2.1 text.
- `THIRD_PARTY_NOTICES.md` lists every runtime, optional, and
  build-time dependency with its license and the role it plays in
  Graphorin.

### Hello-world target

A 20-line script that creates a memory-backed agent, streams tokens,
persists facts to local SQLite via local `transformers.js` embeddings,
survives process restart for HITL approvals when run via
`graphorin start`, and emits OpenTelemetry spans (file or console
exporter). The example lives in `examples/personal-assistant-cli/`.

