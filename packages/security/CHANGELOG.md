# @graphorin/security

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7

## 0.13.6

### Patch Changes

- [#227](https://github.com/o-stepper/graphorin/pull/227) [`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac) Thanks [@o-stepper](https://github.com/o-stepper)! - Grammar-safe redaction now handles signed numeric JSON leaves (deep-retest 0.13.5 P2). Masking `{"card":-4111111111111111}` previously left the minus sign stranded before an unquoted mask (`{"card":-[REDACTED creditcard]}`), producing invalid JSON in all three layers. The new span-based helper `jsonSafeSpan` (exported from `@graphorin/observability/redaction/patterns`, with a local twin in the security guardrail) absorbs the leading sign into the replaced span and emits the quoted mask, so the document stays parseable; a prose minus (`refund -4111... issued`) is untouched. `jsonSafeMask` remains exported with its exact historical behaviour for span-fixed callers, and both docblocks now state the whole-text ambiguity: a text consisting solely of the match is indistinguishable from a single-value JSON document and gets the quoted form. The security `credit-card` pattern is also digit-anchored on both ends, so the match no longer swallows the separator after the PAN (the `[REDACTED:credit-card]` marker used to glue onto the following word). Shared regression corpora (signed leaves in objects / arrays / top level, mixed verifier outcomes) plus seeded JSON-preservation property tests now run in all three suites: any valid JSON document stays valid after redaction.

- Updated dependencies []:
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5

## 0.13.4

### Patch Changes

- [#220](https://github.com/o-stepper/graphorin/pull/220) [`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171) Thanks [@o-stepper](https://github.com/o-stepper)! - Masking a bare numeric JSON leaf now keeps the document parseable: when a redaction match occupies a JSON value position, the mask is emitted in double quotes (`{"card":4111111111111111}` becomes `{"card":"[REDACTED creditcard]"}`), in all three layers - the `withRedaction` provider middleware, the OTLP `RedactionValidator`, and the security `piiDetection` guardrail. Prose and string-leaf masking are unchanged. The helper is exported as `jsonSafeMask` from `@graphorin/observability/redaction/patterns`.

- Updated dependencies []:
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- [#215](https://github.com/o-stepper/graphorin/pull/215) [`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8) Thanks [@o-stepper](https://github.com/o-stepper)! - Redaction no longer corrupts serialized numbers. The `withRedaction` provider middleware now honours per-pattern `verify` predicates in both the request scrub and the streaming scan (previously only the OTLP validator did), the built-in `creditcard` pattern refuses decimal-adjacent digit runs and requires a major-network leading digit (2-6) on top of the Luhn checksum, and the security guardrail's `credit-card` and `us-phone` patterns gained the same boundary guards. Previously a `fact_search` score such as `0.01639344262295082` or an epoch-ms timestamp inside a JSON tool result came back as `[REDACTED creditcard]`, breaking the JSON. Real PANs are still masked.

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

- [#206](https://github.com/o-stepper/graphorin/pull/206) [`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034) Thanks [@o-stepper](https://github.com/o-stepper)! - Two deep-retest (2026-07-19) fixes to the operator onboarding path:

  - **`graphorin init --cloud-consent` is now actionable (P1-4).** The chosen tier used to land only as a `.ts` comment (and vanish entirely from the JSON flavour). `init` now prints the exact `createMemory({ contextEngine: { privacy: ... } })` snippet that ENFORCES the tier as step 5 of the next-steps, and the `.ts` config embeds the same code - both flavours hand the operator the real wiring instead of a decorative choice (memory is composed in code, so the server config genuinely cannot enforce it).
  - **`doctor --all` no longer false-fails on a disabled audit log (P2-1).** A config-driven `doctor` now reports the audit-encryption check as `skip` when the supplied config has `audit.enabled: false`, instead of failing on a binding the disabled subsystem never needs. `checkEncryption(...)` in `@graphorin/security` gains an optional `{ auditEnabled }` argument; the internal "Phase 05" jargon is dropped from the hint.

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

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - Dedupe concurrent OAuth `refresh()` side effects onto a single cycle (e2e 2026-07-16, ORPHAN-SU-03). The HTTP layer already coalesced concurrent refreshes into one token-endpoint round-trip (SPL-12), but every joining caller then re-ran the client-level tail on the shared result - so one actual rotation emitted one `oauth:refreshed` audit row, one `oauth.refreshed` lifecycle event, and one rotation strategy hook PER CALLER, and audit consumers counted a single rotation N times. `createOAuthClient().refresh()` now shares one full cycle (network + persist + audit + lifecycle + hooks) across concurrent callers, honoring the documented "reuses the in-flight refresh promise" contract end to end; a `force: true` refresh bypasses the join and installs itself as the shared promise, exactly like the HTTP-level dedupe. Regression tests pin one-cycle side effects for three concurrent callers, slot reset after settlement, and the forced-bypass path.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(security): OAUTH-ADV-01/02 surface RFC error codes on DCR + device-authorization failures

  - OAUTH-ADV-01: Dynamic Client Registration failures throw the new
    `OAuthRegistrationError` (kind `registration-failed`) carrying the RFC 7591
    `error` / `error_description` body fields, not just the HTTP status.
  - OAUTH-ADV-02: a device-authorization request failure preserves the RFC 8628
    spec error code from the body instead of collapsing to a generic
    `device_authorization_failed`.

  Adds `OAuthRegistrationError` and `readOAuthErrorFields` to the public surface.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7)]:
  - @graphorin/core@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0

## 0.9.0

### Minor Changes

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Channel-inbound trust boundary (bot-adoption wave B, B1.5). New `'channel-inbound'` member of the core `ToolTrustClass` union, registered in the single `UNTRUSTED_TRUST_CLASSES` source so the taint engine and the Rule-of-Two untrusted-input leg agree by construction; `defaultInboundSanitization` maps it to `detect-and-strip-and-wrap`. The `TaintLedger` gains an optional `recordInboundMessage` entry (same widening + verbatim-span semantics as `recordOutput`) - a first-class input for message-borne untrusted content, which the Rule-of-Two deliberately does not derive from ordinary user messages. Agent side: `DataFlowGuardWithLedgers.recordInboundMessage` plus the new `AgentCallOptions.inboundTaint` seed, stamped in run init before the first step (after the AG-19 resume seed; widen-only), so a channel gateway arms the data-flow policy for every run it starts.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Assistant output as a data-flow sink + pluggable injection classifier (bot-adoption wave B, B4 / item 14). `DataFlowEvaluation` gains `sinkKind` (`'tool' | 'assistant-output'`; `isSink` honors it) and the agent guard gains `inspectAssistantOutput`: the run's outgoing text is evaluated as a sink with the stable id `'assistant-output'` in the commit path - enforce-mode blocks replace the durable message with a fixed notice and withhold the run's final output (unified with the lateral-leak path), shadow flags, and `declassifySinks: ['assistant-output']` re-opens the reply surface deliberately; findings land in the B3 verdict sidecar. New `@graphorin/security/inspect` subpath ships the `InjectionClassifier` seam (D-12): the resilient `runInjectionClassifier` (engine errors always degrade to the regex verdict) plus the `injectionClassifierOutputGuardrail` adapter, wired at all three regex layers - inbound sanitisation (`applyInboundSanitizationWithClassifier` in `@graphorin/tools/inbound`, exposed on the channel gateway as `injectionClassifier`), SDF-4 output guardrails, and the memory write-time quarantine gate (`createMemory({ injectionClassifier })`, widen-only). Offline default off everywhere; the framework ships no engine. W-103 stays warn + opt-in per D-13, with `treatPiiAsSensitive: true` recommended in the documented gateway preset.

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Code-mode runtime pass-through (wave-E E3, plan item 13 step 1). The code-mode runtime is now a named provider contract: `CodeModeRunner` (`@graphorin/security/sandbox`) is `(options: BridgedSourceOptions) => Promise<BridgedSourceResult>`, with `runBridgedSource` as the built-in `worker_threads` implementation. `AgentConfig.codeMode: { run?, limits? }` threads a caller-chosen runtime (subprocess provider, remote runner) and script limits (`timeoutMs` / `maxMemoryMb` / `maxToolCalls`) through `registerCodeMode` into `createCodeExecuteTool` - the previously undeliverable `run`/`limits` seam. Fixed invariant: a runner receives only the script source, the allowed tool names, the host `dispatch` bridge, the signal and the limits - credentials, `RunState` and policy stay on the harness side, since every in-script tool call routes back through the executor's governance. Defaults are byte-identical (in-process worker runner).

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Four-value permissionDecision (wave-E E1, plan item 11). The tool-argument policy vocabulary widens to `allow | deny | ask | defer` with priority `deny > defer > ask > allow` (`'forbid'` stays accepted as the alias of `'deny'`): `evaluatePermissionDecision` is the four-value engine, `evaluateToolArgumentPolicy` its fail-closed binary projection, and `isToolDeniedByName` the advertise-time check over predicate-free deny rules. The executor gains the E1 `permissionHook` phase - one caller decision point evaluated on the validated input after schema validation and BEFORE approval; an allowed `updatedInput` rewrite is re-validated and substituted into both the validated input and the effective args (W-118), a throwing hook fails closed, and on `preApproved` resume replays a rewrite of the granted args is refused (tools-02). `ask`/`defer` verdicts ride the agent pre-screen's durable suspend (`ToolApproval.mode`, mirrored on `tool.approval.requested`); the bare executor fails them closed (`approval_denied`), and a granted resume satisfies them (`deny` still outranks the grant). Deny-by-name filters all three surfaces: the advertised per-step catalogue (post-promotions), `tool_search` results/promotion (`excludeTool`), and execution (executor mirror before validation + the run loop's inline handoff/sub-agent check). The defer parking half: `requestApproval(name, payload, { timeoutAt, timeoutDecision? })` stamps a durable deadline on the approval pause (enumerated by the existing timer daemon); a due `tick` resolves it with the timeout decision - `DEFAULT_APPROVAL_TIMEOUT_DECISION` (auto-deny) unless overridden. Sub-agent asks project through the W-001 composite key unchanged.

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0

## 0.8.0

### Patch Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix two sandbox defects found in the 2026-07-11 e2e pass (E-17/S-19 and E-05/D-02). WorkerThreadsSandbox (and the code-mode runBridgedSource runner, which had the same pattern) now settles on ANY worker exit that beats the result message: a worker whose event loop drains and exits 0 without posting yields `execution-failed` "worker exited before producing a result" immediately, instead of hanging until the wall-clock timeout misreports it as `timeout` (or hanging forever when `timeoutMs <= 0`, killing bare-Node hosts with an unsettled top-level await). The timeout timer is also no longer `unref()`'d, so a pending run can keep a draining host loop alive. DockerSandbox now demultiplexes the `Tty: false` container log stream (8-byte frame headers stripped, stdout payloads concatenated) before `JSON.parse`, so every live docker-tier run no longer fails with "Unexpected token 0x01"; plain-text buffers from TTY containers or test stubs still pass through, and the module docstring no longer claims the input is written to stdin (it is embedded in the `node -e` wrapper script). Adds regression tests for the drained-worker exit, the disabled-timer exit path, a `process.exit(0)` code-mode script, and synthetic multiplexed log buffers.

- Updated dependencies []:
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-011: cross-process fencing for the audit hash chain. `AuditDb` gains an optional `transact` member (BEGIN-IMMEDIATE semantics, additive - custom bindings keep compiling); the default binding in `@graphorin/server` implements it with rollback strictly in `finally`. `appendAudit` wraps its `latest()`+`insert()` read-modify-write in the fence, so two processes sharing one audit.db can no longer hash against the same tip; on bindings WITHOUT the fence a seq primary-key collision is now retried (bounded, re-reading the tip) instead of silently dropping the losing security entry. `pruneAudit` runs its delete + suffix re-hash inside ONE transaction - a concurrent append waits for the lock and chains to the post-prune tip instead of leaving a permanent verify break - and FAILS CLOSED on bindings without `transact` (an unsafe prune is worse than a refused one). Verified with worker-thread contention tests against a real encrypted audit.db.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-101: the Rule-of-Two `untrustedInput` leg is actually enforced. It previously fed only `heldLegs`/`holdsFullTrifecta` bookkeeping - a profile giving up the leg still had every web-search/MCP tool callable while both remaining legs were live, exactly the configuration the preset promises to prevent. `buildRuleOfTwoPolicy` now compiles `untrustedInput: false` into a forbid rule over untrusted-SOURCE tools, decided by the new exported `isUntrustedTrustClass` (`@graphorin/security/dataflow`) so the preset and the taint engine share one definition of "untrusted". `ToolCallFacts` gains `untrustedSource?`; the tools executor passes the tool's `trustClass` into `ToolArgumentPolicyGuard.evaluate` (type-level breaking for custom structural guard implementations); the agent adapter derives the fact from it. Untrusted content in user messages is explicitly out of this rule's scope (documented).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-026/W-102: the skill trust root's `publishers` leg is now cryptographically meaningful.

  `publisher` comes from attacker-authored frontmatter and is EXCLUDED from the signed payload (`canonicalizeForSignature` strips the signature block), so a self-signed skill claiming `publisher: trusted.example.com` passed a publishers-only trust root. Now: (1) the `publishers` leg counts only for keys resolved through the `well-known` channel - an inline key can never satisfy it (pin fingerprints for those); (2) at resolve time the well-known key URL's host must equal the publisher or be its subdomain (`keys.vendor.example.com` for `vendor.example.com`), else `SkillSignatureInvalidError`; (3) the default key fetcher sets `redirect: 'error'` so an open redirect on the publisher's domain cannot substitute the key source. BREAKING for operators whose publisher ids are not DNS names or whose keys are hosted off-domain: align the publisher with the serving domain or switch that entry to the `fingerprints` leg.

### Patch Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Audit retention vs Merkle anchoring (W-062):

  - `@graphorin/security`: fixed a crash in `pruneAudit` against the shipped better-sqlite3 binding - the re-hash loop wrote through the connection while `iterate()` held a live statement iterator, throwing "This database connection is busy executing a query" whenever surviving entries needed re-rooting (the in-memory test double masked it). Survivors are now rewritten in closed-iterator batches (bounded memory). The `pruneAudit` package docs now state explicitly that verification against ANY pre-prune Merkle checkpoint fails afterwards by design, indistinguishably from a truncate-and-re-root attack. A contract test pins this behavior.
  - `@graphorin/cli`: `graphorin audit prune` prints a re-anchor reminder after every destructive prune (sign + distribute a fresh checkpoint, mark old anchors superseded).
  - Security guide: new "Retention and anchoring" runbook (prune -> sign fresh checkpoint -> distribute -> supersede old anchors -> accept anchored-history reset) plus the documented identifier-level erasure limitation of the time-prefix-only prune.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - `containsPii` now applies the same Unicode obfuscation pre-pass as the injection catalogue (W-150): NFKC folding plus zero-width stripping via the new case-preserving `normalizeForPiiMatching` (exported from guardrails), so zero-width-split emails and fullwidth-digit SSNs/cards trip the FIDES `sensitiveSeen` taint leg instead of dodging it. Case is preserved because the IBAN and BTC-address patterns are case-sensitive by design. The `piiDetection` guardrail's redaction path still matches the raw text (offset-based rewriting needs the original string) - documented on the guardrail.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Deterministic security adoptions (audit 2026-07-04 Wave C, cluster C6).

  - Derived-taint propagation: opt-in `dataFlowPolicy.derivedTaint: 'strict'` fires the paraphrase-robust `derived-untrusted-to-sink` flow for every model-driven sink call once untrusted content entered the run (CaMeL-style control-flow integrity); the agent also records each tainted step's assistant text as `llm-derived` spans so model-echoed phrasing trips the verbatim probe.
  - Taint into memory (cross-session MINJA leg): `ToolReturn` gains a widen-only `taint` override honoured through the executor record path; `fact_search` / `deep_recall` / `recall_episodes` attach it when any returned item is quarantined or foreign-provenance, re-arming the ledger at recall. `RunState.taintSummary` additionally carries one-way FNV-1a span-tile hashes (no plaintext), so a resumed run re-detects pre-suspend verbatim copies.
  - MCP pinning completed: `toTools({ pinStore })` records fingerprints on first use and REJECTS drift by default when a store is present (rug-pull defense; `onPinMismatch: 'warn'` downgrades); tool-description injection hits at registration are counted (`mcp.tool-description.injection-flagged.total`).
  - Signal-only heuristics + Unicode pre-pass: shared `normalizeForMatching` (NFKC + zero-width strip) applied in the guardrails injection catalogue and the memory quarantine heuristics; security.md repositions all pattern catalogues as best-effort signal, never a sole gate. `TaintLabel.sourceKind` widened to `string` for the new descriptive kinds.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (audit 2026-07-04 Wave D, cluster D4) - architectural, deterministic layers.

  - RFC-6962 Merkle transparency over the audit log (`@graphorin/security/audit`): tree head, inclusion + consistency proofs, and Ed25519-signed checkpoints, so anchoring a signed head out-of-band makes the trail tamper-resistant (a rewrite of a checkpointed prefix fails the consistency proof).
  - Operator trust root for skills: `verifySkillSignature`/`installSkillFrom{Npm,Git}` gain `trustRoot` - a valid signature from a key absent from the root returns `valid: false` reason `'untrusted-key'`.
  - Progent-style tool-argument policies + Rule-of-Two capability profiles (`@graphorin/security/policy`): `AgentConfig.toolPolicy` (forbid-before-allow, default-deny sensitive) + `ruleOfTwo` (drops a lethal-trifecta leg, forcing a read-only capability floor) enforced by a new `ExecutorOptions.argumentPolicy` hook (`capability_blocked`).
  - Code-mode sandbox blocklist parity (`bridged-source.ts`) blocks the process-escape modules (child_process/vm/worker_threads/cluster/inspector) via the ESM resolve hook + a CJS `Module._load` patch.

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627)]:
  - @graphorin/core@0.6.0

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
