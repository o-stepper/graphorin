# @graphorin/mcp

## 0.13.11

### Patch Changes

- Updated dependencies [[`c9e1465`](https://github.com/o-stepper/graphorin/commit/c9e14652cb0674e121bfdaa3b96a75907360ee34)]:
  - @graphorin/security@0.13.11
  - @graphorin/tools@0.13.11
  - @graphorin/core@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies [[`7d47994`](https://github.com/o-stepper/graphorin/commit/7d4799415263d72e4c6744362504b290b55fade4)]:
  - @graphorin/security@0.13.10
  - @graphorin/tools@0.13.10
  - @graphorin/core@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9
  - @graphorin/security@0.13.9
  - @graphorin/tools@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/security@0.13.8
  - @graphorin/tools@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/security@0.13.7
  - @graphorin/tools@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/security@0.13.6
  - @graphorin/tools@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/security@0.13.5
  - @graphorin/tools@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/security@0.13.4
  - @graphorin/tools@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/security@0.13.3
  - @graphorin/tools@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/security@0.13.2
  - @graphorin/tools@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/security@0.13.1
  - @graphorin/tools@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/security@0.13.0
  - @graphorin/tools@0.13.0
  - @graphorin/core@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/security@0.12.1
  - @graphorin/tools@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/security@0.12.0
  - @graphorin/tools@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/security@0.11.0
  - @graphorin/tools@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`42cff94`](https://github.com/o-stepper/graphorin/commit/42cff94a6a3636e3ebe80d22b2b83a428afc727f)]:
  - @graphorin/tools@0.10.2
  - @graphorin/core@0.10.2
  - @graphorin/security@0.10.2

## 0.10.1

### Patch Changes

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - Correct the MCP client downgrade-audit documentation (e2e 2026-07-16, MCP-SKIL-01, doc-drift). The guide referenced `AdaptedToolsResult.downgradedTools` as the audit surface for per-tool trust downgrades, but no such type is exported and `toTools()` returns a plain `Tool[]`. The guide now states the auditable record is the one WARN logged per downgrade at adaptation time.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/security@0.10.1
  - @graphorin/tools@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/security@0.10.0
  - @graphorin/tools@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/security@0.9.0
  - @graphorin/tools@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Wire `secretsStore` through the `@graphorin/mcp/oauth` helpers and stop burning a refresh rotation on every new authorization provider (S-18/13, E-16). `mcpAuthRefresh` and `mcpAuthRevoke` now declare a `readonly secretsStore?` option and forward it into the underlying OAuth client, so a refresh can resolve the persisted refresh token across processes (previously the typed API could never succeed and always threw `has no refresh token`) and a revoke actually fires RFC 7009 against the authorization server instead of silently tearing down only the local record; `mcpAuthListSessions` and `mcpAuthStatus` gain the same option so `hasAccessToken` / `hasRefreshToken` reflect the store. `createOAuthAuthorizationProvider` no longer forces a token refresh on the first `resolveHeader()` of a new instance: when the stored session is provably fresh (outside `refreshAheadMs`) it rehydrates the persisted access token from the secrets store and only refreshes when the token is expired, near expiry, or unresolvable - restart-heavy consumers of single-use rotated refresh tokens no longer invalidate concurrent sessions. Adds happy-path wrapper tests (refresh, RFC 7009 revoke, token-presence resolution) and bridge tests covering the fresh-serve, near-expiry-refresh, forced-refresh, and missing-token-fallback paths.

### Patch Changes

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/security@0.8.0
  - @graphorin/tools@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (W-018, Invariant Labs tool-poisoning class): annotation strings inside MCP tool JSON Schemas (`description`, `title`, `$comment`, string `examples` - at any nesting depth: `properties`, `items` including tuples, `additionalProperties`, `oneOf`/`anyOf`/`allOf`, `$defs`/`definitions`, `patternProperties` and friends) are now stripped of imperative payloads before the schema reaches `buildJsonSchemaValidator`, whose `toJSON()` feeds the provider wire and the `tool_search` projection. Semantic keywords (`enum`, `const`, `pattern`, `required`, property names) are never modified, so input validation is byte-identical. The TOFU fingerprint (`computeToolDefinitionHash`) keeps hashing the RAW definition: existing pins stay valid, and two differently-poisoned schemas cannot collapse into one redacted hash. New counter `mcp.tool-schema.injection-flagged.total` (server/tool) signals hits at registration. An operator's `pass-through` override skips the pass, mirroring `sanitizeDescription`. Minor bump: model-facing schemas may change bytes and new counter increments may appear on existing deployments.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-016/W-140: MCP server identity is transport-derived by default; scoped handles are colon-safe.

  `serverIdentity.id` previously defaulted to the name the remote server self-reported on `initialize` - and every security surface keys off that id: TOFU pins in the pinStore (a rug-pull server minted a fresh record by renaming itself), `mcp:<id>:<uri>` handle scoping (a malicious server claiming a trusted name had its resource_links resolve under the trusted scope), taint labels and audit rows. The id now derives ONLY from the operator-controlled transport config plus the explicit `serverInfoName` override; HTTP-family ids include a non-default port (localhost:3001 and :3002 no longer collide). The self-reported name survives as display-only `reportedServerName`. Because ':' is now routine in ids, `scopedResourceHandle` percent-encodes the id segment and the reader decodes before matching (handles are ephemeral - no migration). MIGRATION: pinStore records keyed by old server-controlled ids orphan and TOFU re-pins under the transport id on first `toTools()` - operators running `onPinMismatch: 'reject'` must re-pin; registry auto-prefix namespaces (derived from the identity) may change model-visible prefixed tool names.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Full TOFU pin lifecycle (W-079). With a `pinStore`, a tool ADDED after the first-use recording is now rejected by default (`MCPToolPinningError`; `onPinMismatch: 'warn'` admits it with the new `mcp.tools.pin-added.total` counter) - previously post-approval additions entered the catalogue unchecked. Removals of pinned tools are observable via `mcp.tools.pin-removed.total` (never an exception - but they can hide a rename). The new `onPinMismatch: 'accept-and-update'` gives operators the documented path to accept a legitimate catalogue change: after the comparison it overwrites the store with the current snapshot (`mcp.tools.pins-updated.total` + log), ending the eternal-warn state without manual store mutation. Explicit `pinnedFingerprints` stay subset-pins and win over the store; servers that legitimately extend their catalogue under a pinStore should use `'warn'` or `'accept-and-update'`.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-080: new opt-in `createManagedMCPClient(options & { reconnect })` - a managed wrapper for long-running agents whose MCP tools must survive a dead stdio child or a lost HTTP session. It implements `MCPClient` by delegating to an inner client it rebuilds on transport close (exponential backoff + jitter; `mcp.reconnect.attempt/success/gave-up.total` counters), and - the key move - its `toTools()` binds adapted tools to the WRAPPER, so already-registered `Tool` objects keep working across a reconnect without re-registration (the full toTools pipeline was extracted into a shared, client-parameterized `runToTools` helper; the plain client uses it byte-identically). After a successful reconnect the wrapper re-runs `toTools()` with the last-used options so the pin comparison / TOFU store re-screens the post-reconnect catalogue (rug-pull caught). Deliberate contracts: an in-flight call is NEVER retried (only the connection heals), and the operator's `onTransportClose` fires once, on final (gave-up) failure. The default `createMCPClient` behaviour is unchanged.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - The ToolReturn envelope gets a symbol brand (W-115). New core exports: `TOOL_RETURN_BRAND` (`Symbol.for`, duplicate-copy safe), the `toolReturn()` factory, and the ONE shared guard `isToolReturnEnvelope` consumed by both the executor's unwrap and the registry's example-normalizer (the duplicated sniff is gone). The structural fallback for unbranded objects is deliberately narrow - own keys within `{output, contentParts, taint}` - so a tool legitimately returning `{output, exitCode, stderr}` now reaches the model whole instead of being silently stripped to `.output`; canonical unbranded literals keep unwrapping and increment `tool.result.envelope.unbranded-toolreturn.total` toward the sniff's future deprecation. First-party producers (MCP adaptCallResult, memory recall tools, toTool taint envelopes) now brand via `toolReturn()`. Downstream consumers relying on extra fields being dropped will now see them; plain data of exactly `{output: X}` remains ambiguous by contract - brand it or rename the field.

### Patch Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (W-017): the text of an MCP `isError` result is now sanitized at the MCP boundary before it rides into `MCPToolExecutionError` and, through the executor, into the model-visible `ToolError.message`. Previously the error path bypassed inbound sanitization entirely (it only ran on the success path), so a malicious server could deliver a prompt-injection payload verbatim via `isError: true`. The error text now goes through the same per-server inbound policy the adapted tool declares (default `detect-and-strip-and-wrap`: imperatives stripped, body wrapped in the `<<<untrusted_content trust="mcp-derived">>>` envelope with embedded delimiters neutralized); an operator's explicit `pass-through` override is honored for parity with the success path. New counter `mcp.tool-error.injection-flagged.total` increments when a pattern fires.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - ReDoS guard hardening (W-078): `looksCatastrophic` now also rejects the alternation-overlap exponential family (`^(a|a)+$`, `^(\w|\d)*$`) - previously only groups whose body ends with a quantifier were caught, so these classic shapes ran on the raw engine and a ~1k-char non-matching input from an untrusted server could stall the event loop practically forever. Additionally, any pattern containing a quantified group now runs under a reduced 1000-char tested-string cap (defense-in-depth against polynomial backtracking). Conservative false positives degrade the pattern to permissive validation - the semantics already documented for guarded and malformed patterns; alternations without a quantified group still validate exactly as before. The TSDoc no longer overclaims: covered classes are enumerated and a linear-time engine (re2) is named as the exact solution.

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - Remove phantom workspace dependencies that no source file imports: agent no longer depends on provider and observability, mcp/workflow/server no longer depend on observability, sessions no longer depends on security (and its memory edge moves to devDependencies where the single test import lives), skills no longer depends on tools. Dead tsdown `external` entries for the removed edges are gone too, so a future import can no longer build as external without a declared dependency. Consumer install graphs shrink accordingly; a new repo-wide `check-phantom-deps` CI gate keeps the manifest graph honest from here on.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-105: an operator downgrade of an MCP tool's `sideEffectClass` below the sink classes (`'read-only'` / `'pure'` via `sideEffectClassByTool`) is now visible: one WARN per tool at adaptation time (naming the server, the tool and every gate the tool leaves - dataflow sink gate, Rule-of-Two writer forbid, read-only capability gate) and a new additive frozen `AdaptedToolsResult.downgradedTools` list for operator audits. The guide documents the consequences and that the server's own `readOnlyHint` is deliberately never trusted for classification. Default behaviour without overrides is byte-identical.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - SDK error classification is code-based, not message-based (W-141): an `McpError`'s message is server-controlled text, so a server phrasing an ordinary failure as "request timed out" or "cancelled by user" could forge the typed `MCPCallTimeoutError`/`MCPCancelledError` classes and skew the operator counters keyed on them. Timeouts now map from `ErrorCode.RequestTimeout` (-32001), cancellation maps from the caller's own AbortSignal state (SDK 1.29 wraps local aborts in the same -32001 code, so the signal - not the error - is the trustworthy fact), and message heuristics remain only as a last resort for plain non-RPC errors plus the benign tool-not-found class. The advertised elicitation capability is now the explicit `{ form: {} }` sub-capability of the 2025-11-25 spec instead of the bare `{}` shorthand.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/security@0.7.0
  - @graphorin/tools@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1
  - @graphorin/security@0.6.1
  - @graphorin/tools@0.6.1

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Deterministic security adoptions (audit 2026-07-04 Wave C, cluster C6).

  - Derived-taint propagation: opt-in `dataFlowPolicy.derivedTaint: 'strict'` fires the paraphrase-robust `derived-untrusted-to-sink` flow for every model-driven sink call once untrusted content entered the run (CaMeL-style control-flow integrity); the agent also records each tainted step's assistant text as `llm-derived` spans so model-echoed phrasing trips the verbatim probe.
  - Taint into memory (cross-session MINJA leg): `ToolReturn` gains a widen-only `taint` override honoured through the executor record path; `fact_search` / `deep_recall` / `recall_episodes` attach it when any returned item is quarantined or foreign-provenance, re-arming the ledger at recall. `RunState.taintSummary` additionally carries one-way FNV-1a span-tile hashes (no plaintext), so a resumed run re-detects pre-suspend verbatim copies.
  - MCP pinning completed: `toTools({ pinStore })` records fingerprints on first use and REJECTS drift by default when a store is present (rug-pull defense; `onPinMismatch: 'warn'` downgrades); tool-description injection hits at registration are counted (`mcp.tool-description.injection-flagged.total`).
  - Signal-only heuristics + Unicode pre-pass: shared `normalizeForMatching` (NFKC + zero-width strip) applied in the guardrails injection catalogue and the memory quarantine heuristics; security.md repositions all pattern catalogues as best-effort signal, never a sole gate. `TaintLabel.sourceKind` widened to `string` for the new descriptive kinds.

### Patch Changes

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - `listTools`/`listResources`/`listPrompts` now follow `nextCursor` and drain the full cursor chain (mcp-skills-02). MCP list operations are paginated since protocol 2024-11-05 and the SDK does not auto-paginate, so a paginating server's catalogue was silently truncated to page 1 - tools beyond it never reached `toTools()`, defer-loading thresholds counted a partial catalogue, and pin fingerprints covered a partial catalogue. A defensive 100-page cap (with a WARN) bounds buggy or adversarial servers that never terminate the chain.

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix critical tool-schema wire bug (tools-01): plain Zod schemas were never converted to JSON Schema, so OpenAI-shaped/Ollama/vercel providers received `{"_def":...}` internals as tool `parameters` and MCP tools serialized to `{}`. Adds a shared structural Zod v3/v4 to JSON Schema converter (`@graphorin/tools/schema`, no new dependencies) used by the agent's `toolToDefinition`, the code-mode signature projection, and `ToolSearchMatch`; MCP's `buildJsonSchemaValidator` now retains the source JSON Schema and exposes it via `toJSON()`. Unprojectable schemas degrade loudly (WARN + permissive `{}`) instead of shipping serialized validator internals.

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

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/tools@0.6.0
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

- Initial release. The `@graphorin/mcp` package ships the typed
  Model Context Protocol client used by Graphorin agents, the
  standalone server, and the CLI. The release surface includes the
  three transports (`stdio`, `streamable-http`, `sse`), the typed
  `MCPClient` (`listTools` / `listResources` / `listPrompts` /
  `callTool` / `readResource` / `getPrompt` / `close`), the
  strategy-aware `toTools()` adapter (per-server inbound
  prompt-injection sanitization, deferred-loading auto-default at
  the 10-tool threshold, structured-content + outputSchema
  round-trip with backward-compatible `TextContent` mirror,
  per-server result envelope overrides, collision-strategy +
  per-server priority, per-server preferredModel + side-effect
  class overrides), the pluggable `EventStore` contract for
  resumable Streamable HTTP sessions (`Mcp-Session-Id` +
  `Last-Event-ID` handshake), the OAuth bridge backed by
  `@graphorin/security/oauth`, the typed error hierarchy, and the
  helper functions consumed by `graphorin auth` (CLI). See the
  package `README.md` for the full surface inventory and the
  workspace `CHANGELOG.md` for the rollup release notes.
