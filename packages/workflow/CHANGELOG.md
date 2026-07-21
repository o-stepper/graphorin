# @graphorin/workflow

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.2

## 0.10.1

### Patch Changes

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the durable timer driver never re-arming at the earliest future wake (e2e 2026-07-13, WORKFLOW-01, major). Each sweep only queried threads already due (`listSuspended({ dueBefore: now })`) and computed the next wake-up from THEIR results, so a thread suspended with a short future timer never contributed - `nextWakeAt` stayed undefined and the next pass was scheduled a full `pollIntervalMs` (default 30s) away, making a `sleepFor(300ms)` durable timer wait out the whole interval. The sweep now looks one poll interval ahead (`dueBefore: now + pollIntervalMs`): threads already due still fire, and the earliest not-yet-due thread within the window sets `nextWakeAt`, so `schedule()` re-arms at `min(pollIntervalMs, earliest wakeAt)`. Regression test pins that a not-yet-due timer inside the poll window populates `nextWakeAt` and shortens the re-arm delay.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7)]:
  - @graphorin/core@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0

## 0.9.0

### Minor Changes

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Durability tail (item 16, A3). `awaitExternal(name, { schema })` validates the resolved payload at the replay delivery point against a structural `PayloadSchemaLike` (zod v3/v4 compatible, no zod dependency in core): a failing payload restores the suspension instead of failing the thread - the invalid value is discarded (never persisted as satisfied), the thread stays suspended on the same awakeable, and the resolver receives a typed `awakeable-payload-invalid` error. New pure helpers `serializeAwakeableRef` / `parseAwakeableRef` round-trip the canonical `(workflowId, threadId, name)` awakeable address through one compact string for single-slot channel surfaces (messenger callback data); the parser returns `null` on malformed input. The server now warns loudly at `start()` when workflows are registered without a durable-timer driver - a `sleepFor` thread would otherwise sleep forever with zero signal (the wiring stays programmatic by design; the config file carries no domain adapters).

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Four-value permissionDecision (wave-E E1, plan item 11). The tool-argument policy vocabulary widens to `allow | deny | ask | defer` with priority `deny > defer > ask > allow` (`'forbid'` stays accepted as the alias of `'deny'`): `evaluatePermissionDecision` is the four-value engine, `evaluateToolArgumentPolicy` its fail-closed binary projection, and `isToolDeniedByName` the advertise-time check over predicate-free deny rules. The executor gains the E1 `permissionHook` phase - one caller decision point evaluated on the validated input after schema validation and BEFORE approval; an allowed `updatedInput` rewrite is re-validated and substituted into both the validated input and the effective args (W-118), a throwing hook fails closed, and on `preApproved` resume replays a rewrite of the granted args is refused (tools-02). `ask`/`defer` verdicts ride the agent pre-screen's durable suspend (`ToolApproval.mode`, mirrored on `tool.approval.requested`); the bare executor fails them closed (`approval_denied`), and a granted resume satisfies them (`deny` still outranks the grant). Deny-by-name filters all three surfaces: the advertised per-step catalogue (post-promotions), `tool_search` results/promotion (`excludeTool`), and execution (executor mirror before validation + the run loop's inline handoff/sub-agent check). The defer parking half: `requestApproval(name, payload, { timeoutAt, timeoutDecision? })` stamps a durable deadline on the approval pause (enumerated by the existing timer daemon); a due `tick` resolves it with the timeout decision - `DEFAULT_APPROVAL_TIMEOUT_DECISION` (auto-deny) unless overridden. Sub-agent asks project through the W-001 composite key unchanged.

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Workflow durability tail (wave-E E2, plan item 16). `fork(threadId, fromCheckpointId, { patch })` merges channel-level values into the forked root's state ("branch here, but with these corrected values"): patch keys must name declared channels and the merged state re-runs the WF-10 JSON-safety guard; over HTTP the same patch is the optional `state` field of `POST /v1/workflows/:id/fork`. New read-only inspection helpers `readThreadState(store, workflowName, threadId)` / `listThreadCheckpoints(...)` decode a thread's latest checkpoint (status, unwrapped channel state, the full pending-pause frontier) and its timeline off a bare `CheckpointStore` by workflow NAME - and back the new operator commands `graphorin workflow inspect <threadId> --workflow <name>` and `graphorin workflow checkpoints <threadId> --workflow <name>` (read-only, exit 1 on unknown thread). The cross-process durability invariant is now pinned end-to-end: a thread suspended on an approval in a SIGKILLed process resumes from SQLite in a fresh one. `multiResume` intentionally not built (decision D-2).

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Reachable per-thread checkpoint erasure (W-005) - `CheckpointStore.deleteThread` finally has supported callers:

  - `@graphorin/workflow`: the workflow handle gains `deleteThread(threadId)` next to `listCheckpoints` (idempotent; deletes every checkpoint + pending write of the thread).
  - `@graphorin/server`: new route `DELETE /v1/workflows/:id/threads/:threadId` under scope `workflows:delete:<id>` (204 on success, 404 for an unknown workflow, 400 when the registered entry does not expose `deleteThread`); `ServerWorkflowLike` gains the optional `deleteThread?` member.
  - `@graphorin/agent`: opt-in `AgentConfig.checkpointPolicy: 'keep' | 'delete-on-terminal'` (default `'keep'` - byte-identical to today). With `'delete-on-terminal'` the run's checkpoint thread is best-effort deleted after `completed`/`failed` runs, mirroring the TL-10 spill lifecycle; `awaiting_approval` and `aborted` runs always keep theirs (the thread is the resume state).

  Full erasure cascades stay the job of the session purge path; these are the operator levers for hygiene and targeted per-thread GDPR requests.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable timers now fire without user polling code (W-032). The engine stamps `CheckpointMetadata.wakeAt` (earliest due frontier timer) on suspended checkpoints; `CheckpointStore` gains the optional `listSuspended(namespace, { dueBefore, limit })` enumeration (implemented by the SQLite adapter - migration 032 adds `workflow_checkpoints.wake_at` with a partial index - and by `InMemoryCheckpointStore`); the new `createTimerDriver({ workflows: [{ workflow, checkpointStore }] })` polls due threads and calls `workflow.tick`, re-arming at `min(pollIntervalMs, earliest nextWakeAt)`, with per-thread error isolation and benign handling of cross-process `checkpoint-version-conflict` races. On the server, `createServer({ workflowTimers: { driver } })` binds a lifecycle daemon and reports `checks.workflowTimers` on `/v1/health`. A custom store without `listSuspended` fails fast with `TimerDriverStoreUnsupportedError`. Threads suspended before migration 032 carry no `wake_at` and stay invisible to the driver until one manual `tick` or resume re-persists them.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Positional pause replay now detects divergence (W-120). Every satisfied resume value is journaled together with the identity of the pause it answered (`PendingPauseRecord.satisfiedMeta`: durable-primitive kind + awakeable/approval name), and `pause()` verifies the identity at each cursor during replay - a node whose pause ORDER depends on time/state/model output fails loudly with the new typed `pause-replay-divergence` WorkflowError (naming the node and the expected vs actual pause) instead of silently delivering a value to the wrong wait. Conservative by design: two plain `pause()` calls carry no identity and are never flagged (false positives impossible), and checkpoints written before the field existed replay their old values unchecked. Consumers with exhaustive switches over `WorkflowErrorCode` must add the new member; workflows that previously "worked by accident" with crossed values will now fail - that is the finding.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - The WF-10 JSON-safety gate now covers the whole checkpoint, not just channel state (W-121): pause values and approval payloads, `Dispatch` args, satisfied resume values (and their W-120 metas), and the failure-frontier task args are walked with the same fail-fast checker before persist, throwing the typed `state-not-serializable` error with a `<pause:node>` / `<dispatch:node>` / `<task:node>` pseudo-channel and exact path. Operator directives are additionally validated at resume ENTRY (`<directive>` pseudo-channel) - a `Date` in `Directive({ resume })` now fails immediately instead of persisting as an ISO string that the node body silently receives on the next replay. Code that previously "worked" with silently-degrading values will now fail fast - the same deliberate contract WF-10 already established for state.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - `maxSteps` now caps steps PER INVOCATION of execute/resume/retry/tick (W-122) - the infinite-loop safeguard it was documented as - instead of the thread lifetime: a durable thread cycling through timers/approvals for months no longer dies at 200 cumulative steps, and a capped-out invocation is retryable with a fresh budget (engine-level failures without a step task list now restore through the suspended-style frontier walk on retry). The cumulative `stepNumber` is untouched (WF-4 checkpoint ordering) and gains the opt-in `WorkflowConfig.maxTotalSteps` lifetime quota (same `max-steps-exceeded` code, distinct message). Rare consumers relying on the lifetime-cap behavior should set `maxTotalSteps`.

### Patch Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-009: checkpoint GC primitives - `CheckpointStoreExt` with `pruneThreads` and `compactThread`.

  The engine writes a full state snapshot per execution step and nothing ever deleted them (`deleteThread` had zero production callers). `@graphorin/core` adds the additive `CheckpointStoreExt` contract: `pruneThreads({beforeEpochMs, onlyTerminal})` - a namespace-SCOPED retention sweep whose policy reads each pair's LATEST checkpoint (suspended threads with live HITL approvals/awakeables survive by default) - and `compactThread(threadId, namespace, keepLast)` for in-place history compaction (resume reads the latest tuple, so `keepLast >= 1` never breaks resumability). Implemented by `SqliteCheckpointStore` (per-pair transactions, never via the namespace-blind `deleteThread` - a reused threadId across workflows must not lose another workflow's suspended state) and by `InMemoryCheckpointStore`. `GraphorinSqliteStore.checkpoints` is now typed `CheckpointStoreExt`. `documentation/guide/workflow-engine.md` gains a "Retention and cleanup" section with the growth arithmetic and the deleteThread caveat.

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - Remove phantom workspace dependencies that no source file imports: agent no longer depends on provider and observability, mcp/workflow/server no longer depend on observability, sessions no longer depends on security (and its memory edge moves to devDependencies where the single test import lives), skills no longer depends on tools. Dead tsdown `external` entries for the removed edges are gone too, so a future import can no longer build as external without a declared dependency. Consumer install graphs shrink accordingly; a new repo-wide `check-phantom-deps` CI gate keeps the manifest graph honest from here on.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation honesty on `journalSteps` and approvals (W-157): the README and guide no longer call the step journal "exactly-once" for side effects - journaled channel writes replay exactly once, but a crash between a task's effect completing and its journal entry landing re-runs the task, so side effects are at-least-once and strict once-semantics need idempotent effects (cross-linked to the re-execution contract). The README's approval example now shows the real API: `requestApproval(name, payload?)` resolved by `workflow.approve(threadId, name, decision)` (there is no `approvalId`).

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable workflow orchestration (audit 2026-07-04 Wave D, cluster D1) - promotes the workflow engine to step-checkpoint durable execution and closes the confirmed `workflow-01..14` correctness floor.

  - Feature floor: atomic checkpoint compare-and-set (`CheckpointStore.put({ expectedLatestId })` + `CheckpointConflictError`, honoured by both bundled stores), planned-order channel writes, merge-failure + boundary-abort + max-steps terminal checkpointing, all-false-`__start__` dead-end, ephemeral-value observability on `workflow.channel.update`, satisfied-pause retention on sibling failure, `maxConcurrentTasks` bounded task pool, `Dispatch` cross-realm brand, and hygiene (dead `visitedNodes`, six->seven stream modes, `'async'` source removed, resume durability override).
  - New durable capabilities: per-node `timeoutMs` + `retry` (`nodeDefaults`), durable timers (`sleepUntil`/`sleepFor` + `workflow.tick`), durable promises (`awaitExternal` + `resolveAwakeable`), persisted approvals (`requestApproval` + `approve`), `WorkflowConfig.version` pinning (`workflow-version-mismatch`) + journal-divergence detection, and opt-in step journaling (`journalSteps`) with crash-recovery that replays completed tasks and re-runs only unfinished work.

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/core@0.6.0
  - @graphorin/observability@0.6.0

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
