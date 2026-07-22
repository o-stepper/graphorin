# @graphorin/sessions

## 0.14.0

### Minor Changes

- [#247](https://github.com/o-stepper/graphorin/pull/247) [`8ff1d25`](https://github.com/o-stepper/graphorin/commit/8ff1d257a489e5da686318d8c617576fbf2b0002) Thanks [@o-stepper](https://github.com/o-stepper)! - Error-hierarchy corrections backing the new error-contract documentation: `ToolRateLimitError` now extends `GraphorinToolsError` (kind `'rate-limited'`) and `TimerDriverStoreUnsupportedError` now extends `WorkflowError` (new `'timer-driver-store-unsupported'` code in the union) - both were direct `Error` subclasses, invisible to catch sites filtering on the package bases. `AgentRuntimeError` and `SessionError` constructors accept a trailing `{ cause }` option so wrapped failures thread their root cause like every other package base.

### Patch Changes

- Updated dependencies [[`8ff1d25`](https://github.com/o-stepper/graphorin/commit/8ff1d257a489e5da686318d8c617576fbf2b0002)]:
  - @graphorin/tools@0.14.0
  - @graphorin/core@0.14.0
  - @graphorin/observability@0.14.0

## 0.13.13

### Patch Changes

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P2: `DockerSandbox` no longer inherits the image's default user (root in most bases) - containers now run as `10001:10001` by default with the `/work` tmpfs owned by that uid, plus a PID ceiling (`pidsLimit`, default 128) and a CPU allowance (`cpus`, default 1) so hostile code cannot fork or busy-loop until the external timeout; all three are `createDockerSandbox` options, and live negative tests prove the uid, rootfs/network denials, and the pids cgroup ceiling on a real daemon. AES-GCM call sites (sessions export, encrypted-file secret store/resolver) now pass an explicit `authTagLength: 16` - behaviour is unchanged (both formats already sliced exactly 16 tag bytes); the invariant is now self-documenting and scanner-quiet.

- [#244](https://github.com/o-stepper/graphorin/pull/244) [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab) Thanks [@o-stepper](https://github.com/o-stepper)! - Fourteenth deep retest P3: every package sitting between an application and a zod-peer package (`core`/`tools`/`memory`/`mcp`) now re-declares the `zod` peer as **optional** (`peerDependenciesMeta`), so strict Yarn PnP installs stop emitting `YN0086` "does not provide zod" warnings - the application root's zod instance flows through the intermediaries. npm/pnpm behaviour is unchanged (optional peers are not auto-installed; the underlying required peers still resolve exactly as before).

- Updated dependencies [[`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab), [`0271df9`](https://github.com/o-stepper/graphorin/commit/0271df93b163af6fe6bdcba3462c13ef488a2aab)]:
  - @graphorin/observability@0.13.13
  - @graphorin/tools@0.13.13
  - @graphorin/core@0.13.13

## 0.13.12

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.12
  - @graphorin/core@0.13.12
  - @graphorin/observability@0.13.12

## 0.13.11

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.11
  - @graphorin/core@0.13.11
  - @graphorin/observability@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.10
  - @graphorin/core@0.13.10
  - @graphorin/observability@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9
  - @graphorin/observability@0.13.9
  - @graphorin/tools@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/observability@0.13.8
  - @graphorin/tools@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/observability@0.13.7
  - @graphorin/tools@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/observability@0.13.6
  - @graphorin/tools@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/observability@0.13.5
  - @graphorin/tools@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/observability@0.13.4
  - @graphorin/tools@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/observability@0.13.3
  - @graphorin/tools@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/observability@0.13.2
  - @graphorin/tools@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/observability@0.13.1
  - @graphorin/tools@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.0
  - @graphorin/core@0.13.0
  - @graphorin/observability@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/observability@0.12.1
  - @graphorin/tools@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/observability@0.12.0
  - @graphorin/tools@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/observability@0.11.0
  - @graphorin/tools@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`42cff94`](https://github.com/o-stepper/graphorin/commit/42cff94a6a3636e3ebe80d22b2b83a428afc727f)]:
  - @graphorin/tools@0.10.2
  - @graphorin/core@0.10.2
  - @graphorin/observability@0.10.2

## 0.10.1

### Patch Changes

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `readToolCassette` crashing with a raw `TypeError` on a JSON `null` body line (e2e 2026-07-16, SESSION-R-03, minor). A `null` line parsed cleanly, then `parsed.kind` was read before checking the value was a non-null object, so `null` escaped the format guard that already rejects scalars/arrays with the typed `CassetteFormatInvalidError`. The reader now rejects any non-object line (null, array, scalar) with the typed error. Regression test added.

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix documented session replay reproducing nothing (e2e 2026-07-16, SESSION-R-01 / SESSION-R-02, major). Two problems combined so `session.replay()` (no arguments) emitted only `replay.start` / `replay.end`: (1) the `graphorin.session.id` attribute defaulted to the `internal` tier, so the default `public` export floor stripped it and `createSqliteSpanExporter` persisted spans with `session_id` NULL - un-keyed and unfindable; and (2) the sanitized replay floor defaulted to `public`, so every `internal`-tier framework span was skipped with reason `sensitivity`. The tracer now tags routing identifiers (`graphorin.session.id`, `graphorin.run.id`) as `public` so a span stays keyable under any export floor, and the default sanitized-replay floor is now `internal` so framework spans replay by default while secret-tier attributes stay excluded and secret/PII patterns are still masked. The observability guide's replay wiring now raises the export floor to `internal` (so the run's telemetry is persisted, not stripped) and documents the floor. Regression tests pin that routing ids survive the default exporter and that a default replay includes internal-tier spans.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/observability@0.10.1
  - @graphorin/tools@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/observability@0.10.0
  - @graphorin/tools@0.10.0

## 0.9.0

### Minor Changes

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Memory writes strictly after guardrails (bot-adoption wave B, B3 / item 15). The run loop's commit gates stamp a per-turn verdict sidecar - `RunState.verdicts`, a plain JSON-safe object keyed `'<step>:<offset>'` with `RunTurnVerdict { guardrail?, lateralLeak?, dataflowFlags? }` - covering input-guardrail block/rewrite, lateral-leak blocks and assistant-output dataflow findings; widen-only merge, serialized through `SerializedRunState` with a defensive rebuild, wiped by compaction for the turns its splice summarized away, and surfaced directly as `AgentResult.verdicts`. Verdicts persist next to the message: `SessionMessagePushOptions.verdict` threads through core `SessionMemoryStore.push` (additive third argument), the memory session tier, `Session.push` and the sqlite store (`verdict_json` column, migration 035; malformed rows degrade to no verdict), and `SessionMessageRecord.verdict` exposes it on the consolidator read path. `createMemory({ ingestGate })` then filters the extraction batch deterministically on BOTH consolidator paths before noise filtering - the canonical `verdictIngestGate` excludes blocked and lateral-leak-withheld turns while rewritten turns pass with their rewritten text; the idempotency cursor still advances through excluded messages (a blocked turn can never wedge consolidation) and a throwing gate fails closed. This gate is the required precondition for the auto-promotion and proactive act-grant features of later waves.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Single-source outbound commentary catalogue (bot-adoption wave B, B2). The byte-identical 7-pattern catalogue plus the envelope helpers (`freshRegex`, `splitByWrapEnvelope`, `sha256Hex`, the wrap delimiters) move to the new `@graphorin/tools/outbound` subpath; the server delivery-layer and session-output sanitizers stay boundary-specific wrappers whose `@stable` consts (`DEFAULT_DELIVERY_COMMENTARY_PATTERNS`, `BUILT_IN_COMMENTARY_PATTERNS`) now re-export the same array reference - pinned by an identity assertion in the cross-package test, so the catalogue can never drift between layers again. `@graphorin/sessions` gains an acyclic dependency on `@graphorin/tools`. The channel gateway consumes the same catalogue as its third boundary (channel default policy `'strip'`, dropping wrapped fragments entirely - messenger peers have no envelope-collapsing UI).

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/tools@0.9.0
  - @graphorin/observability@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/observability@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

### Patch Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-132: `SessionManager.deleteSession` JSDoc now matches the store contract and implementation - the hard-delete cascades into session content (messages/episodes with index rows, the `SESSION_SCOPED_PURGES` registry of session-scoped surfaces, and suspended-run checkpoints); the stale "purge them separately" guidance is gone. Custom `SessionStore` authors are pointed at the full `SessionStoreExt.deleteSession` contract.

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - Remove phantom workspace dependencies that no source file imports: agent no longer depends on provider and observability, mcp/workflow/server no longer depend on observability, sessions no longer depends on security (and its memory edge moves to devDependencies where the single test import lives), skills no longer depends on tools. Dead tsdown `external` entries for the removed edges are gone too, so a future import can no longer build as external without a declared dependency. Consumer install graphs shrink accordingly; a new repo-wide `check-phantom-deps` CI gate keeps the manifest graph honest from here on.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/observability@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1
  - @graphorin/memory@0.6.1
  - @graphorin/security@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/memory@0.6.0
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

- Phase 11 - initial release of `@graphorin/sessions`. Ships the
  hybrid `createSession()` facade that wraps `@graphorin/memory.session`
  for message CRUD (single source of truth), the `AgentRegistry`
  singleton with `register / retire / delete / resolveOrPlaceholder`,
  automatic handoff records with input-filter + secrets-inheritance
  metadata, workflow-run attachments, the JSONL session export
  schema 1.0 (`graphorin-session-export/1.0` - sentinel header +
  footer, N-2 backwards-compat, lenient-forward-parse, opt-in
  `--hash` / `--encrypt`), the tool cassette schema 1.0
  (`graphorin-tool-cassette/1.0`) with the substitution-vs-live
  replay policy honouring per-tool `sideEffectClass`, sanitized-by-
  default replay with audit + 30-day TTL + `traces:read[:sanitized
|:raw]` scopes, and per-message commentary-phase trace
  sanitization at the session-output boundary.
