# @graphorin/tools

## 0.13.10

### Patch Changes

- Updated dependencies [[`7d47994`](https://github.com/o-stepper/graphorin/commit/7d4799415263d72e4c6744362504b290b55fade4)]:
  - @graphorin/security@0.13.10
  - @graphorin/core@0.13.10
  - @graphorin/observability@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9
  - @graphorin/observability@0.13.9
  - @graphorin/security@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/observability@0.13.8
  - @graphorin/security@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/observability@0.13.7
  - @graphorin/security@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/observability@0.13.6
  - @graphorin/security@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/observability@0.13.5
  - @graphorin/security@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/observability@0.13.4
  - @graphorin/security@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/observability@0.13.3
  - @graphorin/security@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/observability@0.13.2
  - @graphorin/security@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/observability@0.13.1
  - @graphorin/security@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/security@0.13.0
  - @graphorin/core@0.13.0
  - @graphorin/observability@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/observability@0.12.1
  - @graphorin/security@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/observability@0.12.0
  - @graphorin/security@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/observability@0.11.0
  - @graphorin/security@0.11.0

## 0.10.2

### Patch Changes

- [#188](https://github.com/o-stepper/graphorin/pull/188) [`42cff94`](https://github.com/o-stepper/graphorin/commit/42cff94a6a3636e3ebe80d22b2b83a428afc727f) Thanks [@o-stepper](https://github.com/o-stepper)! - docs(tools): TOOLS-EX-02 correct the imperative-scan budget default in docstrings

  `SanitizationOptions.budgetMs` and `ExecutorOptions.imperativeBudgetMs` documented
  a `5` ms default, but the effective default is `250` ms (a 5 ms budget is too
  tight on cold/loaded runners and would skip the strip pass, letting injection
  through). The docstrings now match the code; behaviour is unchanged.

- Updated dependencies []:
  - @graphorin/core@0.10.2
  - @graphorin/observability@0.10.2
  - @graphorin/security@0.10.2

## 0.10.1

### Patch Changes

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix a denied per-tool secret access leaving no audit row (e2e 2026-07-16, SECRETS-S-01, security). The `ctx.secrets` accessor gates through the per-tool ACL directly, so when a tool asked for a key outside its `secretsAllowed` the `SecretAccessDeniedError` was thrown without an audit event - unlike the store path, whose `auditStoreOperation` already records denials. The accessor now emits one `secret:get` / `decision: 'denied'` audit event (attributed to the tool, with run/session/agent pointers, never the secret value) before re-throwing, so the documented "fails closed AND writes one audit row" contract holds. The emit is on the accessor path only, so the store path is not double-counted. Regression test pins that a denied `ctx.secrets.require()` produces exactly one denied audit event.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix denied durable-HITL approvals leaving no audit trace (e2e 2026-07-16, TOOL-AUDI-01, major). The agent pre-screens `needsApproval` and suspends the run before the tool reaches the executor, so the executor's approval phase - which emits the `tool:approval:requested` / `granted` / `denied` audit rows - only ran retroactively when a granted call was dispatched, and a denied decision (which never reaches the executor) produced no audit row at all. The agent now emits `tool:approval:requested` at the suspend and `tool:approval:granted` / `tool:approval:denied` when the resume directive resolves, so the full approval lifecycle is on the audit chain regardless of the decision. To avoid a duplicate row, the executor skips its own approval phase on a pre-approved replay (the agent already owns the audited grant). Regression test pins that a denied resume emits exactly one `tool:approval:denied` audit event.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `SanitizationOutcome.bytesStripped` going negative (e2e 2026-07-13, TOOLS-EX-01 / CHANNELS-01, minor). The inbound sanitizer computed `bytesStripped` as the net length delta, but the strip pass REPLACES each match with a redaction mask, and the canonical masks (e.g. `[REDACTED:imperative-pattern]`) are longer than the text they cover, so the value went negative - contradicting its documented "bytes removed" meaning (also surfaced through the `@graphorin/channels` re-export). It is now clamped to a non-negative net-bytes-removed metric (`0` when the masks are at least as long as what they covered, even though matches were stripped - `stripped` / `patternsHit` still report the redaction). Regression assertion added.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/security@0.10.1
  - @graphorin/observability@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/observability@0.10.0
  - @graphorin/security@0.10.0

## 0.9.0

### Minor Changes

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Channel-inbound trust boundary (bot-adoption wave B, B1.5). New `'channel-inbound'` member of the core `ToolTrustClass` union, registered in the single `UNTRUSTED_TRUST_CLASSES` source so the taint engine and the Rule-of-Two untrusted-input leg agree by construction; `defaultInboundSanitization` maps it to `detect-and-strip-and-wrap`. The `TaintLedger` gains an optional `recordInboundMessage` entry (same widening + verbatim-span semantics as `recordOutput`) - a first-class input for message-borne untrusted content, which the Rule-of-Two deliberately does not derive from ordinary user messages. Agent side: `DataFlowGuardWithLedgers.recordInboundMessage` plus the new `AgentCallOptions.inboundTaint` seed, stamped in run init before the first step (after the AG-19 resume seed; widen-only), so a channel gateway arms the data-flow policy for every run it starts.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Single-source outbound commentary catalogue (bot-adoption wave B, B2). The byte-identical 7-pattern catalogue plus the envelope helpers (`freshRegex`, `splitByWrapEnvelope`, `sha256Hex`, the wrap delimiters) move to the new `@graphorin/tools/outbound` subpath; the server delivery-layer and session-output sanitizers stay boundary-specific wrappers whose `@stable` consts (`DEFAULT_DELIVERY_COMMENTARY_PATTERNS`, `BUILT_IN_COMMENTARY_PATTERNS`) now re-export the same array reference - pinned by an identity assertion in the cross-package test, so the catalogue can never drift between layers again. `@graphorin/sessions` gains an acyclic dependency on `@graphorin/tools`. The channel gateway consumes the same catalogue as its third boundary (channel default policy `'strip'`, dropping wrapped fragments entirely - messenger peers have no envelope-collapsing UI).

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Assistant output as a data-flow sink + pluggable injection classifier (bot-adoption wave B, B4 / item 14). `DataFlowEvaluation` gains `sinkKind` (`'tool' | 'assistant-output'`; `isSink` honors it) and the agent guard gains `inspectAssistantOutput`: the run's outgoing text is evaluated as a sink with the stable id `'assistant-output'` in the commit path - enforce-mode blocks replace the durable message with a fixed notice and withhold the run's final output (unified with the lateral-leak path), shadow flags, and `declassifySinks: ['assistant-output']` re-opens the reply surface deliberately; findings land in the B3 verdict sidecar. New `@graphorin/security/inspect` subpath ships the `InjectionClassifier` seam (D-12): the resilient `runInjectionClassifier` (engine errors always degrade to the regex verdict) plus the `injectionClassifierOutputGuardrail` adapter, wired at all three regex layers - inbound sanitisation (`applyInboundSanitizationWithClassifier` in `@graphorin/tools/inbound`, exposed on the channel gateway as `injectionClassifier`), SDF-4 output guardrails, and the memory write-time quarantine gate (`createMemory({ injectionClassifier })`, widen-only). Offline default off everywhere; the framework ships no engine. W-103 stays warn + opt-in per D-13, with `treatPiiAsSensitive: true` recommended in the documented gateway preset.

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - Scaffold preset (decision D-10): `createAgent({ scaffold: 'minimal' | 'full' })`, default `'full'` (pre-C6 behaviour). `'minimal'` is the cheap-run posture: instructions-only system prompt, defer-loading by default via the new registry-level `deferLoadingByDefault` option (`createToolRegistry` / `normaliseTool`; per-tool `defer_loading: false` still wins and `built-in` registrations stay eager), no plan tool / recitation - contradictory explicit flags are fail-fast config errors, and security layers are untouched. New "Minimal profile" guide page covers the preset, the lean install path and the README-on-demand skill pattern over lazy `Skill.resources`.

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Code-mode runtime pass-through (wave-E E3, plan item 13 step 1). The code-mode runtime is now a named provider contract: `CodeModeRunner` (`@graphorin/security/sandbox`) is `(options: BridgedSourceOptions) => Promise<BridgedSourceResult>`, with `runBridgedSource` as the built-in `worker_threads` implementation. `AgentConfig.codeMode: { run?, limits? }` threads a caller-chosen runtime (subprocess provider, remote runner) and script limits (`timeoutMs` / `maxMemoryMb` / `maxToolCalls`) through `registerCodeMode` into `createCodeExecuteTool` - the previously undeliverable `run`/`limits` seam. Fixed invariant: a runner receives only the script source, the allowed tool names, the host `dispatch` bridge, the signal and the limits - credentials, `RunState` and policy stay on the harness side, since every in-script tool call routes back through the executor's governance. Defaults are byte-identical (in-process worker runner).

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Four-value permissionDecision (wave-E E1, plan item 11). The tool-argument policy vocabulary widens to `allow | deny | ask | defer` with priority `deny > defer > ask > allow` (`'forbid'` stays accepted as the alias of `'deny'`): `evaluatePermissionDecision` is the four-value engine, `evaluateToolArgumentPolicy` its fail-closed binary projection, and `isToolDeniedByName` the advertise-time check over predicate-free deny rules. The executor gains the E1 `permissionHook` phase - one caller decision point evaluated on the validated input after schema validation and BEFORE approval; an allowed `updatedInput` rewrite is re-validated and substituted into both the validated input and the effective args (W-118), a throwing hook fails closed, and on `preApproved` resume replays a rewrite of the granted args is refused (tools-02). `ask`/`defer` verdicts ride the agent pre-screen's durable suspend (`ToolApproval.mode`, mirrored on `tool.approval.requested`); the bare executor fails them closed (`approval_denied`), and a granted resume satisfies them (`deny` still outranks the grant). Deny-by-name filters all three surfaces: the advertised per-step catalogue (post-promotions), `tool_search` results/promotion (`excludeTool`), and execution (executor mirror before validation + the run loop's inline handoff/sub-agent check). The defer parking half: `requestApproval(name, payload, { timeoutAt, timeoutDecision? })` stamps a durable deadline on the approval pause (enumerated by the existing timer daemon); a due `tick` resolves it with the timeout decision - `DEFAULT_APPROVAL_TIMEOUT_DECISION` (auto-deny) unless overridden. Sub-agent asks project through the W-001 composite key unchanged.

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/security@0.9.0
  - @graphorin/observability@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/observability@0.8.0
  - @graphorin/security@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-031: an inline timeout now actually STOPS the tool and stops inviting unsafe retries.

  The TL-4 inline wall-clock previously rejected the awaiting promise but never aborted the per-call linked signal, so even a well-behaved tool listening on `ctx.signal` kept running in the background after the model was told it timed out. The timer now calls `linkedAbort.abort()` before rejecting; classification is reordered so the self-inflicted linked abort still reports `kind: 'timeout'` while a REAL cancellation (parent run signal) keeps reporting `'aborted'`. Recovery-envelope policy: a timeout on a `side-effecting`/`external-stateful` tool WITHOUT an `idempotencyKey` is now `recoverable: false` + `recoveryHint: 'report_to_user'` with a model-facing "the first invocation may still have completed; do not retry blindly" hint - the generic `retry_later` was an open invitation to double-execute a slow payment call. Read-only, pure and idempotency-keyed tools keep `retry_later`; `recoveryForKind` itself is unchanged for other call sites.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-101: the Rule-of-Two `untrustedInput` leg is actually enforced. It previously fed only `heldLegs`/`holdsFullTrifecta` bookkeeping - a profile giving up the leg still had every web-search/MCP tool callable while both remaining legs were live, exactly the configuration the preset promises to prevent. `buildRuleOfTwoPolicy` now compiles `untrustedInput: false` into a forbid rule over untrusted-SOURCE tools, decided by the new exported `isUntrustedTrustClass` (`@graphorin/security/dataflow`) so the preset and the taint engine share one definition of "untrusted". `ToolCallFacts` gains `untrustedSource?`; the tools executor passes the tool's `trustClass` into `ToolArgumentPolicyGuard.evaluate` (type-level breaking for custom structural guard implementations); the agent adapter derives the fact from it. Untrusted content in user messages is explicitly out of this rule's scope (documented).

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-051: tools/MCP telemetry finally reaches the server's operator surfaces - shadow-mode dataflow findings are observable without hand-wiring.

  - `@graphorin/tools`: `CounterSnapshot` gains a `kinds` record (`'counter'` vs `'gauge'` per key, tracked at write time) so exporters can bridge monotonic counters with delta-inc and gauges with absolute set.
  - `/v1/metrics`: every scrape folds the live `tool.*` / `mcp.*` counters into the Prometheus registry as lazily-registered `graphorin_tool_*` / `graphorin_mcp_*` series (delta-synced counters - re-scrapes never double-count; absolute gauges; label values sanitized). Histograms are deliberately not bridged yet (documented; raw observations stay available via `snapshotCounters()`).
  - Audit chain: a new bridge subscribes `onToolAudit` to the tamper-evident audit log, governed by `audit.toolEvents`: `'security'` (default - dataflow flagged/blocked/declassified, sanitization, approvals, collisions, cap-disabled), `'all'` (adds per-call `tool:execute:*`), `'off'`. Unsubscribed and drained on shutdown before the audit DB closes. Exported for embedders as `bridgeToolAuditToAudit` / `syncToolCounters`.
  - `@graphorin/server` now depends on `@graphorin/tools` directly (it previously reached tools types only transitively).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Spill result handles are run-scoped (W-114). `read_result` now rejects handles belonging to another run by default (`tool.result.read.cross-run-denied.total` counter; resume of the same run keeps working since the runId is stable) - `createReadResultTool({ allowCrossRun: true })` is the explicit opt-out for deliberate cross-run flows such as folding a sub-agent's handle. The file reader adds defense in depth for every consumer including code-mode: taint sidecars (`.meta.json`) are never readable through handles, and a handle must be exactly `graphorin-spill:<runId>/<file>` (deep or flat shapes are refused, which also subsumes most path traversal). The executor's in-memory `handleProducerTaint` map is bounded (FIFO eviction, `ExecutorOptions.handleProducerTaintCap`, default 1024) - evicted handles restore their producer taint from the on-disk sidecar, so eviction never launders taint. Direct users of `createFileResultReader` outside `read_result` get the shape/sidecar guards but not the run scope (that lives at the tool level).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - The ToolReturn envelope gets a symbol brand (W-115). New core exports: `TOOL_RETURN_BRAND` (`Symbol.for`, duplicate-copy safe), the `toolReturn()` factory, and the ONE shared guard `isToolReturnEnvelope` consumed by both the executor's unwrap and the registry's example-normalizer (the duplicated sniff is gone). The structural fallback for unbranded objects is deliberately narrow - own keys within `{output, contentParts, taint}` - so a tool legitimately returning `{output, exitCode, stderr}` now reaches the model whole instead of being silently stripped to `.output`; canonical unbranded literals keep unwrapping and increment `tool.result.envelope.unbranded-toolreturn.total` toward the sniff's future deprecation. First-party producers (MCP adaptCallResult, memory recall tools, toTool taint envelopes) now brand via `toolReturn()`. Downstream consumers relying on extra fields being dropped will now see them; plain data of exactly `{output: X}` remains ambiguous by contract - brand it or rename the field.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-116: an auto-prefix collision loser can no longer vanish silently. `autoPrefix` now (1) falls back to a deterministic `<kind>-<hash>` namespace when the sanitised source identity is empty (e.g. an MCP serverIdentity made of non-alphanumerics), and (2) truncates an over-128-char candidate to the limit with a hash suffix instead of refusing the rename - so a typical loser is ALWAYS uniquely renamed. For the residual cases (a rename target already occupied - which previously minted a fresh, unprocessed collision - or a pathological unrenameable source) the loser is dropped OBSERVABLY: a new additive `CollisionResolution` variant `{ action: 'suppressed' }`, a `tool:collision:suppressed` audit event (decision `denied`) and the `tool.collision.suppressed.total` counter. Existing auto-prefix outcomes for normal namespaces are byte-identical.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-117: honest streaming backpressure semantics + a bounded aggregation buffer. The README no longer claims a drop-oldest queue: sink delivery is synchronous, the `streamingEventQueueDepth` guard only trips on sink re-entrancy and drops the CURRENT (newest) event. New `maxBufferBytes` on `StreamingChannelOptions` (threaded from `ExecutorOptions.streamingMaxBufferBytes`, default 8 MiB, exported as `DEFAULT_MAX_BUFFER_BYTES`): past the cap, chunks keep delivering to subscribers but stop accumulating in the buffer-becomes-output `chunks`, dropped bytes are counted (`tool.streaming.buffer.dropped-bytes.total`) and the additive `StreamingAggregator.bufferTruncated` flag marks the assembled body incomplete for the envelope / spill path. A runaway streaming tool can no longer grow host memory without bound; sub-cap behaviour is byte-identical (lossless buffer).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-013: the declared `zod ^3.23 || ^4` peer range now actually typechecks under zod@4.

  Two classes of breakage fixed: (a) `ZodLikeError.issues[].path` is now `ReadonlyArray<PropertyKey>` - zod 4 bases `$ZodIssue.path` on `PropertyKey`, and the shim must be a superset of both peer majors or the canonical `tool({ inputSchema: z.object({...}) })` failed to compile for every zod@4 consumer even with `skipLibCheck` (type-level breaking for downstream code assigning path elements to `string | number`; `validateOrThrow` maps elements through `String` first since `join` throws on symbols); (b) the published d.ts of `@graphorin/memory` (fact/block/recall/runbook tools) and `@graphorin/tools` (read_result, tool_search, code-mode meta-tools) baked concrete v3 `z.ZodObject<...>` generics via `z.infer<typeof schema>` aliases - replaced with explicit exported interfaces whose schema parity is pinned by in-source compile-time gates. The pack gate gains a `dts-no-concrete-zod-generics` leg and CI no longer allow-fails the zod4 leg - both zod majors are enforced at `skipLibCheck: false` from here on.

### Patch Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Dataflow sink-gate consistency (W-118): `DataFlowGuard.inspect` now receives the raw-shaped POST-REPAIR arguments (`effectiveArgs` from the validate phase) instead of the model's original `call.args` - the same payload the approval gate and the argument policy already evaluate, and the payload the executed input is deterministically derived from. Spans introduced by the arg-repair hook are now visible to the verbatim taint probe; without a repair hook the behavior is bytes-identical. Documented residual limitation: probing happens before schema coercion, so text introduced purely by Zod `transform`/`default` is not probed.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (W-030): `wrapEnvelope` now neutralizes untrusted-content envelope delimiters embedded in the wrapped body before interpolation. An untrusted MCP / web-search / skill result containing a literal `<<</untrusted_content>>>` (or a fabricated nested `<<<untrusted_content ...>>>` opening) can no longer prematurely close or spoof the trust envelope: embedded markers are rewritten with the same visible bracket-substitution the memory package's CE-15 compaction path uses (`[[/untrusted_content]]` / `[[untrusted_content`), tolerant to case and whitespace variations. Marker-free bodies pass through bytes-equal (Python doctest `>>>` and heredoc `<<<` fragments are untouched; a generalized angle-run collapse exists only behind the opt-in `neutralizeAngleRuns` flag). New exports on `@graphorin/tools/inbound`: `neutralizeEnvelopeDelimiters`, `UNTRUSTED_CONTENT_OPEN_PREFIX`, `UNTRUSTED_CONTENT_CLOSE`. Zero-width insertion was explicitly rejected as a mechanism because models read through zero-width splits.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Cross-page imperative patterns in spill artifacts are now caught at spill time (W-156): `read_result` pages are strip-scanned independently, so a pattern split by a page boundary ("ignore previous" at the end of page N, "instructions" at the start of N+1) evaded the heuristic layer in both halves. The framework now runs one whole-artifact scan in `spillToFile` before ANY `SpillWriter` (custom writers included) and passes `imperativePatternsPresent` in the write opts; the default writer persists it in the taint sidecar, the file reader surfaces it as `producerImperativeFlagged`, and the executor increments the new `tool.inbound.sanitization.cross-page-flag.total` counter on tainted handle reads. The load-bearing defenses were never boundary-dependent and are unchanged: every tainted page keeps its unconditional `<<<untrusted_content>>>` envelope and producer-taint provenance; artifacts without producer taint deliberately carry no flag.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/security@0.7.0
  - @graphorin/observability@0.7.0

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
