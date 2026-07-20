# @graphorin/server

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/protocol@0.13.8
  - @graphorin/security@0.13.8
  - @graphorin/store-sqlite@0.13.8
  - @graphorin/tools@0.13.8
  - @graphorin/triggers@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/protocol@0.13.7
  - @graphorin/security@0.13.7
  - @graphorin/store-sqlite@0.13.7
  - @graphorin/tools@0.13.7
  - @graphorin/triggers@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/security@0.13.6
  - @graphorin/store-sqlite@0.13.6
  - @graphorin/tools@0.13.6
  - @graphorin/triggers@0.13.6
  - @graphorin/core@0.13.6
  - @graphorin/protocol@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- [#225](https://github.com/o-stepper/graphorin/pull/225) [`a1e5154`](https://github.com/o-stepper/graphorin/commit/a1e515442786b0dc448067e9f994b72fbf8b6a5f) Thanks [@o-stepper](https://github.com/o-stepper)! - `graphorin start` can now serve the full domain surface. A new `app` config field points at a compose module; the launcher imports it, calls the default-exported factory (typed as `GraphorinAppFactory` in `@graphorin/server`, with `GraphorinAppContext` / `GraphorinAppBag` alongside) and spreads the returned adapter bag into `createServer(...)`, mounting sessions / memory / agents / workflows instead of the bare infrastructure daemon. The bag's optional `close` hook runs after `server.stop()` on shutdown. `graphorin init --app` scaffolds a working `graphorin.app.mjs` (SQLite store + memory + sessions REST adapters over the configured storage) and wires the config field; the scaffold is boot-tested in CI.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/protocol@0.13.5
  - @graphorin/security@0.13.5
  - @graphorin/store-sqlite@0.13.5
  - @graphorin/tools@0.13.5
  - @graphorin/triggers@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/security@0.13.4
  - @graphorin/store-sqlite@0.13.4
  - @graphorin/tools@0.13.4
  - @graphorin/triggers@0.13.4
  - @graphorin/core@0.13.4
  - @graphorin/protocol@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/security@0.13.3
  - @graphorin/store-sqlite@0.13.3
  - @graphorin/tools@0.13.3
  - @graphorin/triggers@0.13.3
  - @graphorin/core@0.13.3
  - @graphorin/protocol@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/security@0.13.2
  - @graphorin/store-sqlite@0.13.2
  - @graphorin/tools@0.13.2
  - @graphorin/triggers@0.13.2
  - @graphorin/protocol@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/protocol@0.13.1
  - @graphorin/security@0.13.1
  - @graphorin/store-sqlite@0.13.1
  - @graphorin/tools@0.13.1
  - @graphorin/triggers@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/security@0.13.0
  - @graphorin/tools@0.13.0
  - @graphorin/core@0.13.0
  - @graphorin/protocol@0.13.0
  - @graphorin/store-sqlite@0.13.0
  - @graphorin/triggers@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/protocol@0.12.1
  - @graphorin/security@0.12.1
  - @graphorin/store-sqlite@0.12.1
  - @graphorin/tools@0.12.1
  - @graphorin/triggers@0.12.1

## 0.12.0

### Minor Changes

- [#195](https://github.com/o-stepper/graphorin/pull/195) [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable suspended agent runs (migration 038): a run parked on durable HITL (`awaiting_approval`) now survives a server restart. The `RunStateTracker` mirrors every park into the new `store.suspendedRuns` sidecar (`suspended_runs` table, session-scoped for the erasure cascade), boot hydration re-registers persisted parks, and `POST /runs/:runId/resume` rehydrates them through the owning agent's new `serializeState` / `deserializeState` codec (version-stamped, binary-safe, secret-redacted - the `Agent` interface gains both methods). Rows are dropped when the run settles (resume completes/fails, or an explicit `POST /runs/:runId/abort`); the graceful-shutdown force-abort deliberately keeps them. Custom `ServerAgentLike` fixtures without the codec keep today's in-memory behaviour and the resume endpoint answers an actionable `409 run-state-unavailable`; an unreadable durable payload answers `500 run-state-invalid`.

- [#195](https://github.com/o-stepper/graphorin/pull/195) [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7) Thanks [@o-stepper](https://github.com/o-stepper)! - BREAKING: `metrics.requireAuth` now defaults to `true` - `GET /v1/metrics` requires a verified token with the `admin:metrics:read` scope out of the box (the exposition leaks operational intel: trigger ids in labels, consolidator budgets). Give your Prometheus scrape job a token (`authorization.credentials_file`) or restore the old behaviour explicitly with `metrics: { requireAuth: false }` for trusted-network scrapes; the existing non-loopback WARN still fires on the opt-out.

### Patch Changes

- [#195](https://github.com/o-stepper/graphorin/pull/195) [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7) Thanks [@o-stepper](https://github.com/o-stepper)! - The server now states its TLS posture explicitly: it serves plaintext HTTP only (no in-process TLS by design), and binding a non-loopback host logs a startup WARN until the operator acknowledges the fronting reverse proxy with the new `server.tlsTerminatedUpstream: true` config flag. The flag records intent and silences the warning; it changes no runtime behaviour.

- Updated dependencies [[`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7)]:
  - @graphorin/store-sqlite@0.12.0
  - @graphorin/triggers@0.12.0
  - @graphorin/core@0.12.0
  - @graphorin/protocol@0.12.0
  - @graphorin/security@0.12.0
  - @graphorin/tools@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/security@0.11.0
  - @graphorin/store-sqlite@0.11.0
  - @graphorin/tools@0.11.0
  - @graphorin/triggers@0.11.0
  - @graphorin/protocol@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`42cff94`](https://github.com/o-stepper/graphorin/commit/42cff94a6a3636e3ebe80d22b2b83a428afc727f)]:
  - @graphorin/tools@0.10.2
  - @graphorin/core@0.10.2
  - @graphorin/protocol@0.10.2
  - @graphorin/security@0.10.2
  - @graphorin/store-sqlite@0.10.2
  - @graphorin/triggers@0.10.2

## 0.10.1

### Patch Changes

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix a failed server start stranding already-started daemons (e2e 2026-07-16, SERVER-CH-01, major). The domain gateway starts LAST, so a vendor channel adapter throwing during `start()` left the consolidator, scheduler, and workflow-timer daemons running with no way to stop them - and because the failed start reset `started`, a follow-up `stop()` threw `LifecycleNotStartedError`, so the public handle could not unwind the leak (an always-on deployment could only recover by killing the process). `start()` now unwinds every already-started daemon (in reverse order) and closes a bound listener before rethrowing, and `stop()` after a failed start is a safe no-op instead of throwing. Regression test injects a gateway whose `start()` throws and asserts the earlier-started timer driver is stopped and `stop()` resolves.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix two server defects (e2e 2026-07-16/13). TOKENS-RE-01 (major, security): `DELETE /v1/tokens/:id` revoked the persisted row but never invalidated the live `TokenVerifier` LRU, so a just-used token kept authenticating from cache for up to `cacheTtlMaxMs` (default 60s) after revocation. The route now threads the live verifier and passes it to `revokeToken`, which evicts the cache entry immediately (the SPL-9 seam that was already available). SERVER-C-01 (major): a failing workflow yields a `workflow.error` EVENT and ends its stream without throwing, so the background runner's catch never fired - it emitted the raw event (`{ threadId, error }`, no `runId`/top-level `code`/`message`) and marked the run `completed`. The runner now re-shapes a `workflow.error` event to the documented `{ runId, code, message }` wire envelope and settles the run as `failed` with the error (on the execute, resume, and iterate paths). Regression tests added: a warm revoked token stops authenticating after a REST revoke, and a failing workflow execute reports run status `failed` with the error code.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix graceful shutdown hanging forever with a connected WebSocket client (e2e 2026-07-16, WS-LIFECY-02, critical; also WS-LIFECY-01). `dispatcher.shutdown()` sent each subscription a `lifecycle`/`aborted` frame and cleared in-memory state but never closed the underlying sockets, so `http.Server.close()` waited on idle subscribers indefinitely and `stop()` (the SIGTERM path the CLI installs) never resolved - an always-on deployment's restart/deploy could only be forced with SIGKILL. `shutdown()` now closes every connected socket with the documented `server.shutdown` close code (4007), which also fixes the previously-unemitted 4007 code, and `stop()` gains a drain-budget fallback that force-closes any lingering connection so it cannot hang even on a stalled close handshake. A regression test asserts `stop()` completes promptly with an idle and a subscribed WebSocket client connected, and that the client receives close code 4007.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(server): SERVER-DO-01 surface the triggers orphaned count on /v1/health

  The triggers daemon status reports `orphaned` (persisted rows with no registered
  declaration), but the `/v1/health` `checks.triggers` block dropped the field even
  though the docs promise it. `TriggersCheck` now carries `orphaned` and the health
  collector copies it (0 on the failure branch).

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/security@0.10.1
  - @graphorin/protocol@0.10.1
  - @graphorin/store-sqlite@0.10.1
  - @graphorin/tools@0.10.1
  - @graphorin/triggers@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies [[`214c20f`](https://github.com/o-stepper/graphorin/commit/214c20f1b2dc7463b683a86f50bc6b10c11ca3f0)]:
  - @graphorin/store-sqlite@0.10.0
  - @graphorin/triggers@0.10.0
  - @graphorin/core@0.10.0
  - @graphorin/protocol@0.10.0
  - @graphorin/security@0.10.0
  - @graphorin/tools@0.10.0

## 0.9.0

### Minor Changes

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Trigger consolidation on a settled segment (item 7, A2). New `buffer:N` consolidator trigger fires the light+standard chain when the unconsolidated transcript tail (from the standard-phase cursor) reaches N tokens - measured with the same chars/4 proxy over the same rendering as the W-081 transcript budget. The tail is evaluated on activity signals via the new `Consolidator.notifyActivity(scope?)`; the documented contract is "buffer:N OR idle:T", whichever comes first, with the existing trigger cooldown damping bursts. The server wires the signal automatically: the run tracker (the single choke point every REST/WS run passes) now emits activity events - every tracked run resets the triggers scheduler's idle window (`recordActivity()`, making `idle:T` a true debounce), and a settled run re-evaluates `buffer:N`. `RunStateTracker.setActivityListener` and the `buffer` trigger reason/spec are additive API.

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Durability tail (item 16, A3). `awaitExternal(name, { schema })` validates the resolved payload at the replay delivery point against a structural `PayloadSchemaLike` (zod v3/v4 compatible, no zod dependency in core): a failing payload restores the suspension instead of failing the thread - the invalid value is discarded (never persisted as satisfied), the thread stays suspended on the same awakeable, and the resolver receives a typed `awakeable-payload-invalid` error. New pure helpers `serializeAwakeableRef` / `parseAwakeableRef` round-trip the canonical `(workflowId, threadId, name)` awakeable address through one compact string for single-slot channel surfaces (messenger callback data); the parser returns `null` on malformed input. The server now warns loudly at `start()` when workflows are registered without a durable-timer driver - a `sleepFor` thread would otherwise sleep forever with zero signal (the wiring stays programmatic by design; the config file carries no domain adapters).

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Triggers hardening (W-123 + W-124). Scheduler: persisted rows without a re-registered declaration are surfaced at `start()` with a WARN and a new `orphaned` scheduler event instead of being skipped silently, and `Scheduler.orphans()` lists them; register-time catch-up is deferred to `start()` so user callbacks never fire on a not-started scheduler. Cron: new `timezone` option (IANA, validated eagerly) evaluates the expression against the zone's wall clock with Vixie DST semantics - fixed-time jobs swallowed by a spring-forward gap run once immediately after the transition and fall-back repeats run only on the first pass, while wildcard minute/hour jobs follow the new wall clock without compensation; `isValidTimeZone` is exported. Server: `POST /v1/triggers/prune` accepts `{ disabled?: boolean = true, orphaned?: boolean = false }` and reports per-bucket removals; the triggers daemon status gains an `orphaned` count.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - New package `@graphorin/channels` - the messenger front door (bot-adoption wave B, item 1). The vendor-neutral adapter SPI (`ChannelAdapter`, `InboundChannelMessage`, the `ChannelIdentity` triple, `ChannelCapabilities`, `DeliveryPayload` with the optional `question` HITL placeholder, typed fire-and-forget `ChannelDeliveryError`); a deterministic identity router (ordered route table, first-match-wins, mandatory catch-all, stable per-peer `defaultSessionKey`; sessionKey is a routing selector, never an authz token); the access policy (`pairing` default with one-time TTL codes and a per-channel pending cap, `allowlist`, `open`, `disabled`) over the new `PairingStore` contract in `@graphorin/core/contracts` (sqlite implementation behind migration 034, exposed as `createSqliteStore(...).pairing`); the gateway runtime (bounded per-adapter queues with shed-on-overflow, access check before any routing or model spend, inbound sanitisation + ready-made `inboundTaint` seed, reply/proactive delivery through the shared outbound catalogue with channel-default `'strip'`); and `@graphorin/channels/testkit` (loopback adapter, in-memory pairing store, framework-agnostic adapter conformance suite). Core also gains the canonical `SttAdapter` contract whose transcripts pin `trustClass: 'channel-inbound'`. The server hosts the gateway structurally (`createServer({ channels })`, new `@graphorin/server/channels` subpath): started last / stopped first in the lifecycle, aggregated into `/v1/health`, and bridged so accepted inbound messages call `scheduler.recordActivity()`. No vendor adapters ship with the framework.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Single-source outbound commentary catalogue (bot-adoption wave B, B2). The byte-identical 7-pattern catalogue plus the envelope helpers (`freshRegex`, `splitByWrapEnvelope`, `sha256Hex`, the wrap delimiters) move to the new `@graphorin/tools/outbound` subpath; the server delivery-layer and session-output sanitizers stay boundary-specific wrappers whose `@stable` consts (`DEFAULT_DELIVERY_COMMENTARY_PATTERNS`, `BUILT_IN_COMMENTARY_PATTERNS`) now re-export the same array reference - pinned by an identity assertion in the cross-package test, so the catalogue can never drift between layers again. `@graphorin/sessions` gains an acyclic dependency on `@graphorin/tools`. The channel gateway consumes the same catalogue as its third boundary (channel default policy `'strip'`, dropping wrapped fragments entirely - messenger peers have no envelope-collapsing UI).

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - Escalation-ladder routing + server agent-HITL resume (closes the W-119 residual). `POST /v1/runs/:runId/resume` now resumes in-process suspensions for real: the run tracker gains `'awaiting_approval'` status with retained resumable `RunState` (`suspend`/`registerSuspended`/`suspendedStateOf`; exempt from retention pruning, cleared on settle/abort), the `/agents/:id/run` route parks suspended results instead of mislabeling them completed, and the resume body is a strict `{ approvals: [...] }` (409 for not-suspended / state-unavailable / agent-busy). `@graphorin/proactive` adds the routing layer: `outcomeToDelivery` (structural mirror of the channels `DeliveryPayload`, pinned compatible by test), `workflowAwakeableOutcome` (awakeable-parked question/review with the D-1 `wf:` ref), and the `suspendedRuns` messenger bridge on cron tasks (registers parked fires with the server tracker under `registryAgentId`, default `proactive-<id>` - avoid ':' in registry ids, it is the scope-segment separator). The client SDK's `resume(...)` now posts the directive as the body (the old `{ directive }` wrapper targeted the retired 501).

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Workflow durability tail (wave-E E2, plan item 16). `fork(threadId, fromCheckpointId, { patch })` merges channel-level values into the forked root's state ("branch here, but with these corrected values"): patch keys must name declared channels and the merged state re-runs the WF-10 JSON-safety guard; over HTTP the same patch is the optional `state` field of `POST /v1/workflows/:id/fork`. New read-only inspection helpers `readThreadState(store, workflowName, threadId)` / `listThreadCheckpoints(...)` decode a thread's latest checkpoint (status, unwrapped channel state, the full pending-pause frontier) and its timeline off a bare `CheckpointStore` by workflow NAME - and back the new operator commands `graphorin workflow inspect <threadId> --workflow <name>` and `graphorin workflow checkpoints <threadId> --workflow <name>` (read-only, exit 1 on unknown thread). The cross-process durability invariant is now pinned end-to-end: a thread suspended on an approval in a SIGKILLed process resumes from SQLite in a fresh one. `multiResume` intentionally not built (decision D-2).

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/store-sqlite@0.9.0
  - @graphorin/core@0.9.0
  - @graphorin/triggers@0.9.0
  - @graphorin/security@0.9.0
  - @graphorin/tools@0.9.0
  - @graphorin/protocol@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Server e2e remediation cluster (2026-07-11):

  - E-02 (S-15/8): the WebSocket subscribe RPC reply now reaches the wire BEFORE any replayed frames. `WsDispatcher.subscribe` accepts `deferReplay: true` and the ok result exposes an idempotent `dispatchReplay()`, so the upgrade handler acknowledges the subscription first and then delivers the captured replay in buffer order (lastEventId semantics unchanged). Previously clients that key their subscription map off the reply dropped every replayed frame on fresh subscribe and reconnect-resume.
  - E-03 (S-14b/17): `/v1/metrics` mounts AFTER the auth middleware, so `metrics.requireAuth = true` finally works - a bearer with `admin:metrics:read` (or `admin:*`) gets 200, no token gets 401, wrong scope gets 403. The `requireAuth = false` path stays unauthenticated via the existing middleware skip list.
  - E-11 (S-09/4): `GET /v1/workflows/:id/state` maps workflow errors through the wire envelope like tick does - an unknown or deleted thread answers `404 {"error":"thread-not-found"}` instead of escaping as a plain-text 500.
  - E-21 (S-24/16): `stop()` only closes stores the server created itself. A caller-injected `createServer({ store })` store stays open so it can be shared across restarts (the documented restartFactory pattern); `ServerLifecycleDeps` gains an `ownsStore` flag.
  - S-09 (minor): `/v1/health` clamps `walSizeBytes` to 0 when the database is not in WAL journal mode (SQLite reports log=-1, which surfaced as -4096); the `graphorin_storage_wal_size_bytes` gauge is clamped the same way.

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/security@0.8.0
  - @graphorin/store-sqlite@0.8.0
  - @graphorin/tools@0.8.0
  - @graphorin/triggers@0.8.0
  - @graphorin/core@0.8.0
  - @graphorin/protocol@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-110: both audit.db open paths now apply the CS-7 cipher-selection pragmas before `PRAGMA key`, so `config.audit.cipher` actually selects the cipher (it was silently ignored - every audit.db came out as the sqlite3mc default, and tools opening it with the declared `sqlcipher` failed with SQLITE_NOTADB). The audit default is pinned to `chacha20` (NOT the main store's `sqlcipher`): pre-fix audit files were created without cipher pragmas, i.e. in chacha20 format, so the pin stays byte-compatible with every existing file. Unknown cipher values fail fast. UPGRADE NOTE: a deployment whose config has long carried `audit.cipher: 'sqlcipher'` (previously ignored) will now fail to open its existing chacha20 file - remove the setting or re-encrypt the audit database. `cipherSelectionPragmas` is now exported from `@graphorin/store-sqlite`.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Reachable per-thread checkpoint erasure (W-005) - `CheckpointStore.deleteThread` finally has supported callers:

  - `@graphorin/workflow`: the workflow handle gains `deleteThread(threadId)` next to `listCheckpoints` (idempotent; deletes every checkpoint + pending write of the thread).
  - `@graphorin/server`: new route `DELETE /v1/workflows/:id/threads/:threadId` under scope `workflows:delete:<id>` (204 on success, 404 for an unknown workflow, 400 when the registered entry does not expose `deleteThread`); `ServerWorkflowLike` gains the optional `deleteThread?` member.
  - `@graphorin/agent`: opt-in `AgentConfig.checkpointPolicy: 'keep' | 'delete-on-terminal'` (default `'keep'` - byte-identical to today). With `'delete-on-terminal'` the run's checkpoint thread is best-effort deleted after `completed`/`failed` runs, mirroring the TL-10 spill lifecycle; `awaiting_approval` and `aborted` runs always keep theirs (the thread is the resume state).

  Full erasure cascades stay the job of the session purge path; these are the operator levers for hygiene and targeted per-thread GDPR requests.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Unified retention scheduler (W-010 / W-008). The server now runs a periodic sweep (`config.retention`, default every 6 hours, first sweep immediately at startup) over every SQLite growth surface. Default-on for derived/recoverable data with conservative windows: spans older than 30 days, consolidator run counters older than 90 days, exhausted DLQ batches older than 30 days, and expired idempotency records (subsuming the W-061 hourly sweep). Primary user content is strictly opt-in via explicit windows: `sessionsDays` (+ `sessionsClosedOnly`, default true), `auditDays`, `memoryHistoryDays`, and `workflowThreadsDays` (always terminal-only threads). `retention.enabled: false` disables the mechanism entirely. Each surface prunes in its own try/catch: a failure logs WARN and never blocks the others; a sweep that deleted rows logs INFO with per-surface counts through the new `createConsoleRetentionLog` (the first consumer of `observability.logger`). New exports: `scheduleRetentionSweeps`, `RetentionConfig`, `RetentionStoreLike`, `RetentionLog`, `createConsoleRetentionLog`. BEHAVIOUR CHANGE on upgrade: old span telemetry and expired idempotency bodies start being deleted by default - set `retention: { enabled: false }` or widen the windows to keep them. The deployment guide gains a growth-surface table (including the file-based replay-JSONL directory, which stays cron-territory) and lib-mode scheduling guidance.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable timers now fire without user polling code (W-032). The engine stamps `CheckpointMetadata.wakeAt` (earliest due frontier timer) on suspended checkpoints; `CheckpointStore` gains the optional `listSuspended(namespace, { dueBefore, limit })` enumeration (implemented by the SQLite adapter - migration 032 adds `workflow_checkpoints.wake_at` with a partial index - and by `InMemoryCheckpointStore`); the new `createTimerDriver({ workflows: [{ workflow, checkpointStore }] })` polls due threads and calls `workflow.tick`, re-arming at `min(pollIntervalMs, earliest nextWakeAt)`, with per-thread error isolation and benign handling of cross-process `checkpoint-version-conflict` races. On the server, `createServer({ workflowTimers: { driver } })` binds a lifecycle daemon and reports `checks.workflowTimers` on `/v1/health`. A custom store without `listSuspended` fails fast with `TimerDriverStoreUnsupportedError`. Threads suspended before migration 032 carry no `wake_at` and stay invisible to the driver until one manual `tick` or resume re-persists them.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-051: tools/MCP telemetry finally reaches the server's operator surfaces - shadow-mode dataflow findings are observable without hand-wiring.

  - `@graphorin/tools`: `CounterSnapshot` gains a `kinds` record (`'counter'` vs `'gauge'` per key, tracked at write time) so exporters can bridge monotonic counters with delta-inc and gauges with absolute set.
  - `/v1/metrics`: every scrape folds the live `tool.*` / `mcp.*` counters into the Prometheus registry as lazily-registered `graphorin_tool_*` / `graphorin_mcp_*` series (delta-synced counters - re-scrapes never double-count; absolute gauges; label values sanitized). Histograms are deliberately not bridged yet (documented; raw observations stay available via `snapshotCounters()`).
  - Audit chain: a new bridge subscribes `onToolAudit` to the tamper-evident audit log, governed by `audit.toolEvents`: `'security'` (default - dataflow flagged/blocked/declassified, sanitization, approvals, collisions, cap-disabled), `'all'` (adds per-call `tool:execute:*`), `'off'`. Unsubscribed and drained on shutdown before the audit DB closes. Exported for embedders as `bridgeToolAuditToAudit` / `syncToolCounters`.
  - `@graphorin/server` now depends on `@graphorin/tools` directly (it previously reached tools types only transitively).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - `POST /v1/tokens` enforces attenuation-only minting (W-106): a token principal can only mint scopes its own grant covers (`scopeMatches` semantics - `admin:*` covers all, two-segment grants cover three-segment requests, never the reverse), answering `403 scope-escalation-denied` with the uncovered list otherwise; delegation chains narrow monotonically since the child's `tokens:create` must itself be covered. Syntactically invalid requested scopes now answer `400` instead of minting a token that grants nothing. Integrations that minted wider tokens through a bare `tokens:create` service token must grant the minter the full target set (or `admin:*`). The anonymous trusted-loopback operator (auth disabled) is exempt; the CLI path is unaffected.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Scope granularity is symmetric across every surface (W-107). Session REST reads (`GET /:id`, `/messages`, `/handoffs`, `/export`, `DELETE`) and the SSE fallback (`GET /v1/sessions/:id/events`) now require per-resource `sessions:<verb>:<sessionId>` - a token scoped to one session gets the same access on REST/SSE it already had on WS, while bare two-segment grants keep covering everything (the global list stays a two-segment administrative read). `POST /v1/session/ws-ticket` requires only authentication (the ticket adds no rights; every subscribe is per-subject gated) - read-only tokens get their browser WS path. Run control binds to the run's OWNING resource on BOTH surfaces: REST `/runs/:runId/{state,abort,resume}` and WS `run.cancel` / `notifications/cancelled` resolve the run first (unknown id answers 404/RUN_NOT_FOUND before scope; runIds are unguessable and ephemeral) and then require `agents:{read,invoke}:<agentId>` or `workflows:{read,execute}:<workflowId>`; a three-segment grant for another agent's run is now denied. Dynamic scope requirements parse with the non-throwing parser, so junk URL segments answer 403 instead of 500. New helpers `checkScope` and `createAuthenticatedMiddleware` are exported from the middleware module.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - The server workflow surface exposes every D1 primitive over HTTP (W-119). `POST /:id/resume` accepts an optional `name` that routes through `resolveAwakeable` (targeting one of several parallel awakeables/approvals); new `POST /:id/retry` (background replay of a failed/aborted thread) and `POST /:id/tick` (synchronous due-timer firing with `{fired, nextWakeAt}`) under `workflows:resume:<id>`; `POST /:id/fork` performs a REAL fork (the periphery-01 honest 501 retires) returning `201 { newThreadId }`, defaulting to the thread's latest checkpoint. `ServerWorkflowLike` gains the optional `retry/tick/resolveAwakeable/fork` methods and an `opts.signal` third parameter on `resume`; background resume/retry now receive the run tracker's AbortSignal so `runs.abort(runId)` actually cancels them.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - `POST /agents/:id/stream` rejects a malformed body with the same `400 config-invalid` envelope as its sibling `/run` route (W-151), validated through one shared helper BEFORE any run is registered - previously a failed parse silently launched the agent on an empty prompt behind a successful-looking 202, burning provider tokens. Empty and absent bodies stay valid via the schema default, so minimal legitimate calls are unaffected; clients that relied on the silent 202 for invalid bodies now get the honest 400.

### Patch Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-011: cross-process fencing for the audit hash chain. `AuditDb` gains an optional `transact` member (BEGIN-IMMEDIATE semantics, additive - custom bindings keep compiling); the default binding in `@graphorin/server` implements it with rollback strictly in `finally`. `appendAudit` wraps its `latest()`+`insert()` read-modify-write in the fence, so two processes sharing one audit.db can no longer hash against the same tip; on bindings WITHOUT the fence a seq primary-key collision is now retried (bounded, re-reading the tip) instead of silently dropping the losing security entry. `pruneAudit` runs its delete + suffix re-hash inside ONE transaction - a concurrent append waits for the lock and chains to the post-prune tip instead of leaving a permanent verify break - and FAILS CLOSED on bindings without `transact` (an unsafe prune is worse than a refused one). Verified with worker-thread contention tests against a real encrypted audit.db.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Disk-hygiene fix (W-061): expired `idempotency_records` (each row stores the full `response_json` of a keyed POST) are now swept from the database on a periodic timer (`scheduleIdempotencyPruning`, hourly, unref-ed, stopped on `server.stop()`). Previously `SqliteIdempotencyStore.prune` existed but had zero callers - expiry was only checked on the read path, so response bodies accumulated on disk indefinitely. The sweep deletes exactly the records the read path already refuses to replay; IETF-draft replay semantics are unchanged.

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - Remove phantom workspace dependencies that no source file imports: agent no longer depends on provider and observability, mcp/workflow/server no longer depend on observability, sessions no longer depends on security (and its memory edge moves to devDependencies where the single test import lives), skills no longer depends on tools. Dead tsdown `external` entries for the removed edges are gone too, so a future import can no longer build as external without a declared dependency. Consumer install graphs shrink accordingly; a new repo-wide `check-phantom-deps` CI gate keeps the manifest graph honest from here on.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - The server's sibling peer floors (`@graphorin/agent`/`memory`/`sessions`/`workflow`) now track the current minor (W-135): the static `workspace:>=0.5.0 <1.0.0` range let npm silently assemble a mixed install (agent@0.5.0 under server@0.6.x). The floor is rewritten to the just-computed minor by `bump-version --sync` AFTER `changeset version` (a statically narrow range would re-trigger the changesets fixed-group escalation to a phantom 1.0.0), and `check-version-consistency` fails any release pass that skips the rewrite.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-046: JSON-safe `WireAgentEvent` projection for all binary-bearing event variants, applied on the server WS path.

  `@graphorin/core` gains `WireFileGeneratedEvent`, `WireToolExecutePartialEvent`, `WireAgentEndEvent` (whose `result.state` is the `WireRunState` projection) plus the `WireAgentEvent` union and pure `toWireAgentEvent`/`fromWireAgentEvent` codecs. The `AgentEvent` TSDoc now documents the real two-layer wire contract (envelope `{eventId, subject, type, payload}` with `payload = WireAgentEvent`) instead of the false claim that `@graphorin/protocol` re-exports the union; protocol stays zod-only with a doc pointer. The server's `backgroundStreamAgent` projects every streamed event before emitting, so `file.generated`, binary `tool.execute.partial` chunks and a multimodal `agent.end` state arrive at WS clients decodable instead of as numeric-key mush. An exhaustive `Record<AgentEvent['type'], ...>` fixture gate in core forces a wire decision for every future event variant.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Machine-readable workflow failure codes on the wire (W-052): the `workflow.error` WS frame payload and the run-status `error` object now carry `code` (and `hint` when the source error has one) next to the unchanged `message`. Normalization happens at the server boundary via the new internal `toWireError` helper - `err.code` (agent/workflow error family) wins, `err.kind` (tools/memory/provider/server family) is the fallback, `'unknown'` otherwise - so clients can retry `checkpoint-version-conflict` and abandon `node-execution-failed` without parsing English text. No package-internal discriminators were renamed; the field is additive.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - WS replay-buffer memory-leak fix (W-028): a periodic prune sweep (`scheduleReplayBufferPruning`, default every 60 s, `stream.replayBuffer.pruneIntervalSeconds` config) now applies the already-documented TTL to every subject, so finished-run subjects (a fresh runId per run, never touched again by push/replay) no longer retain up to 1000 full payloads forever on a long-living server. Emptied subjects release their `dropped`-map entry too; a resume whose cursor misses the buffer still reports `droppedCount >= 1` (the miss itself proves the gap), so the replay-marker keeps firing. The `@stable` `ReplayBuffer` interface gains an OPTIONAL `stats?(): { subjects, events }` (external implementations keep compiling; `createReplayBuffer` always provides it), and the `graphorin_replay_buffer_events` gauge now reports buffered EVENTS as its name says - previously it was filled with the subscription count (dashboards reading it will see the corrected semantics). Replay semantics inside the TTL window are unchanged; servers without WS are unaffected.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Security fix (W-027): the WebSocket replay path now sanitizes every buffered frame with the same delivery-commentary sanitizer as the live path and the SSE replay. Previously a fresh WS subscription (or a reconnect-resume) received up to 1000 raw buffered frames, bypassing the `wrap`/`strip` commentary policy and its audit decisions exactly on the reconnect scenario the buffer exists for. Delivery now goes through a single `dispatchSanitized` choke point shared by the live and replay paths, so future delivery paths cannot silently bypass the sanitizer; replayed bytes are identical to live bytes for the same frame (single sanitize per delivery, no double-wrap), and the `lastEventId` ordering invariant is unchanged.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/security@0.7.0
  - @graphorin/store-sqlite@0.7.0
  - @graphorin/tools@0.7.0
  - @graphorin/protocol@0.7.0
  - @graphorin/triggers@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1
  - @graphorin/protocol@0.6.1
  - @graphorin/security@0.6.1
  - @graphorin/store-sqlite@0.6.1
  - @graphorin/triggers@0.6.1

## 0.6.0

### Patch Changes

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Server / client / periphery correctness (audit 2026-07-04 Wave B, cluster B6).

  - periphery-01: `POST /v1/workflows/:id/resume` actually resumes - it background-iterates `workflow.resume(threadId, {resume})` and emits every event on the `workflow:<id>/runs/<runId>/events` subject (mirroring execute); the fictional unmounted SSE URL is gone and the run completes. `POST /v1/workflows/:id/fork` returns an honest 501 instead of a 202 that forked nothing.
  - periphery-02: `standalone-server.md` now states plainly that `graphorin start` serves health/metrics/tokens/tickets/WS-SSE only and that the domain routes mount only when adapters are composed programmatically via `createServer({...})`.
  - periphery-03: the client SSE fallback survives reconnects - `#reconnect` no longer attempts the RPC resubscribe on the read-only SSE transport (which threw and permanently killed the subscription); the reconnect carries the subscription's cursor as a `Last-Event-ID` header so the server replays only missed events; a closed bound subscription is recreated on the next `subscribe()`.
  - periphery-08: the idempotency middleware tracks in-flight keyed executions - a concurrent duplicate gets `409 idempotency-in-flight` + `Retry-After` instead of double-executing (per draft-ietf-httpapi-idempotency-key-header).
  - periphery-09: `subscribe({ target: 'run' })` without `sessionId` throws a clear client-side error instead of building a `run:` subject the server grammar can never accept.
  - periphery-10: session-stream subjects gate on `sessions:read:<sessionId>` (read-only streams, sessionId resource slot) instead of `agents:invoke:<sessionId>`, aligning with the SSE route's requirement.
  - periphery-11: interval triggers under `catchupPolicy: 'none'` advance to the next FUTURE boundary after downtime instead of firing immediately on restart; `recordActivity()` no longer arms idle timers on a stopped scheduler (P-14).
  - periphery-05: the TransformersJS embedder throws for an unknown model with no `dim` hint (the PS-11 fix ported from the Ollama embedder) instead of assuming 768 - a wrong assumed width baked a wrong-width id + vec0 table and the id changed after the first embed; a width drift against a bound dim now throws too.
  - P-05: the WS upgrade bearer verification passes the client IP so the per-IP failure lockout engages for upgrade attempts (previously a lockout-free brute-force surface).
  - Docs: the fictional "disconnect policy" section replaced with the real reconnect-and-replay behaviour; the WS ticket endpoint path corrected to `/v1/session/ws-ticket`.

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Release-pipeline and tarball-surface fixes (audit 2026-07-04 Wave E, cluster E2). `@graphorin/memory`'s `./conflict` subpath was runtime-EMPTY on npm 0.5.0 (`export { };` - preserveModules emitted the module without an explicit tsdown entry); it now ships all 8 runtime exports. `@graphorin/server`'s internal `workspace:*` peer dependencies are ranged (`workspace:>=0.5.0 <1.0.0`) so changesets stops escalating every sibling bump into a bogus MAJOR for the whole fixed group (the 1.0.0 landmine on the release bot's branch). `@graphorin/eslint-plugin` gains the `./package.json` self-export. All 27 per-package CHANGELOGs gain the 0.5.0 section (they were frozen at 0.1.0 inside every published tarball), and the `mvp-readiness` release gate now rejects a stale-CHANGELOG or unresolvable-exports release.

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/store-sqlite@0.6.0
  - @graphorin/core@0.6.0
  - @graphorin/triggers@0.6.0
  - @graphorin/security@0.6.0
  - @graphorin/observability@0.6.0
  - @graphorin/protocol@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

Initial release. See the workspace root `CHANGELOG.md` for the full
release notes; the per-package changelog is generated by Changesets
and tracks subsequent updates.
