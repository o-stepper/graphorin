# @graphorin/client

## 0.15.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.14.0

## 0.13.13

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.13

## 0.13.12

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.12

## 0.13.11

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.6

## 0.13.5

### Patch Changes

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/protocol@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/protocol@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.11.0

## 0.10.2

### Patch Changes

- [#190](https://github.com/o-stepper/graphorin/pull/190) [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553) Thanks [@o-stepper](https://github.com/o-stepper)! - docs: reconcile the last P3 doc drift from the 2026-07 e2e campaign

  - ORPHAN-SU-02: the reconnect backoff docstring matches the implementation
    (`baseMs * 2^(attempt-1)`, exponent clamped at 30, `attempt` 1-indexed).
  - LATERAL-L-03: the `ProtocolGuardConfig` docstring no longer claims a
    non-existent `Agent.protocolGuard` knob; it is passed to `guardOutboundContent`
    / `resolvePolicy` when wiring server boundaries.
  - SCAFFOLD-D1: the channels guide clarifies that only the `<<<commentary>>>`
    envelope is stripped outbound; `<<<untrusted_content ...>>>` markers are an
    inbound-only wrapper and are not removed on echo.
  - Guide pages catch up with the MEMORY-C-03 behavior that shipped in 0.10.1:
    a bare `createMemory()` documents compaction as off-and-silent until a
    `providerContextWindow` is supplied (memory-system table + agent-runtime
    context-management section), and the channels guide shows the real
    untrusted-content envelope attributes (`trust=` / `tool=` / `origin=`).

- Updated dependencies []:
  - @graphorin/protocol@0.10.2

## 0.10.1

### Patch Changes

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.

- Updated dependencies [[`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/protocol@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.10.0

## 0.9.0

### Minor Changes

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - Escalation-ladder routing + server agent-HITL resume (closes the W-119 residual). `POST /v1/runs/:runId/resume` now resumes in-process suspensions for real: the run tracker gains `'awaiting_approval'` status with retained resumable `RunState` (`suspend`/`registerSuspended`/`suspendedStateOf`; exempt from retention pruning, cleared on settle/abort), the `/agents/:id/run` route parks suspended results instead of mislabeling them completed, and the resume body is a strict `{ approvals: [...] }` (409 for not-suspended / state-unavailable / agent-busy). `@graphorin/proactive` adds the routing layer: `outcomeToDelivery` (structural mirror of the channels `DeliveryPayload`, pinned compatible by test), `workflowAwakeableOutcome` (awakeable-parked question/review with the D-1 `wf:` ref), and the `suspendedRuns` messenger bridge on cron tasks (registers parked fires with the server tracker under `registryAgentId`, default `proactive-<id>` - avoid ':' in registry ids, it is the scope-segment separator). The client SDK's `resume(...)` now posts the directive as the body (the old `{ directive }` wrapper targeted the retired 501).

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Stop dropping server frames that arrive before the subscribe RPC reply, and add run-scoped workflow subscriptions (E-02 client half S-15/8, E-12 S-09/5). The server dispatches replayed frames (tagged with the NEW subscriptionId) before the subscribe/resubscribe RPC reply, but the client only mapped the subscriptionId after the reply resolved, so every replayed frame - on a fresh subscribe against a populated replay buffer and on the reconnect resume path - was silently dropped and `for await` consumers hung. The client now buffers event/lifecycle/replay-marker frames for unknown subscriptionIds while a subscribe RPC is in flight (bounded by `subscriptionQueueLimit`, surfacing the same typed `flow-overflow` close on overflow) and flushes them in arrival order once the reply maps the id; frames with no subscribe in flight are still dropped. Separately, the workflow `SubscriptionTarget` gains an optional `runId`: `subscribe({ target: 'workflow', id, runId })` now builds the run-scoped subject `workflow:<id>/runs/<runId>/events` advertised by the execute/resume routes (the only subject the server emits workflow run events on), mirroring the agent target. Regression tests cover the real wire order (replay before AND after the reply), the pre-map buffer bound, and every subject shape.

### Patch Changes

- Updated dependencies []:
  - @graphorin/protocol@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - The per-subscription client event buffer is bounded (W-152): when a slow `for await` consumer lets the queue reach `GraphorinClientOptions.subscriptionQueueLimit` (default 10000, 10x the server's per-connection default; `0` restores the old unbounded behavior), the subscription closes with the new typed `flow-overflow` `GraphorinClientErrorKind` - a deterministic error in the iterator instead of unbounded heap growth or silent frame loss, mirroring the server's queue-overflow close. Frames arriving after close no longer grow the dead queue, and `SubscriptionMetadata.queuedEvents` exposes the live buffer depth. The `@stable` error-kind union grows additively; exhaustive switches without a default branch must add the member.

### Patch Changes

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-108: when a `transport: 'auto'` client reconnects and falls back from WebSocket to SSE, surviving WS subscriptions are now closed with a typed `TransportFailedError` instead of hanging their `for await` consumers forever. SSE carries exactly one bound-session subject, so agent/workflow subscriptions are fundamentally unresumable over it - the deterministic error (with a recovery hint: force `transport: 'ws'` or read the bound session subject) hands the decision to the application; an endless WS retry would wedge against servers with WS disabled. The bound `'__sse__'` subscription is untouched, so the SSE-first resume path (periphery-03) is unchanged. The `transport` option TSDoc documents the behaviour.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/protocol@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/protocol@0.6.1

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

- Updated dependencies []:
  - @graphorin/protocol@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial Phase 14b release: reference TypeScript client for the
  Graphorin standalone server. Wraps the `graphorin.protocol.v1`
  WebSocket subprotocol (with an optional SSE fallback for
  proxy-restricted environments) behind an ergonomic
  `GraphorinClient` class: `connect()`, `subscribe({ target, id })`
  returning an async-iterable subscription, `cancel(runId, opts)`,
  `resume(runId, directive)`, `ping()`, `disconnect()`. Handles the
  browser ticket flow, exponential-backoff reconnect with replay
  buffer resume, and Zod-validated frame parsing on both
  directions. Browser-friendly: zero Node-only dependencies. Created
  and maintained by Oleksiy Stepurenko.
