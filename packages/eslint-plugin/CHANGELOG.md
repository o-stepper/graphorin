# @graphorin/eslint-plugin

## 0.13.4

## 0.13.3

## 0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

## 0.13.0

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - `no-implicit-network-call` now activates in two stages: the linted file path must match `packages/*/src` AND the nearest `package.json` name must start with a prefix from the new `packagePrefixes` option (default `['@graphorin/']`). Downstream pnpm monorepos with the standard layout stop getting errors on their own `fetch()` calls just for adopting `flat/recommended`; a consumer that wants the rule to police their own scope passes `['error', { packagePrefixes: ['@myorg/'] }]`. When no package.json resolves above the file (virtual paths, programmatic Linter runs) the rule fails OPEN to the old path-only activation, so resolution hiccups can only over-flag, never silently disable the guard. The rule is now also dogfooded against the framework's own source in tests (sharing the check-no-network ALLOW_LIST as the single source of exemptions), and a lockstep contract test pins both matchers' verdicts over a shared corpus - closing the known axios asymmetry (the CI script now flags `axios(...)`/`axios.get(...)` call sites, not just imports).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Tool discovery and grading are comment-aware (W-044). Discovery and every grading path run over a comment-blanked view of the source (newlines preserved, offsets stable; string/template and - conservatively - regex literals untouched): a commented-out `tool({...})` no longer appears in `graphorin tools lint` reports or the three ESLint tool rules, a commented-out property inside a live literal is never extracted, a commented email inside a live `examples:` block no longer penalizes the axis, and a `tool(` inside a string never matches. `DiscoveredTool` gains `gradingSource` (the blanked slice all graders consume) while `source` keeps the original text for reports. The description axis gets a deterministic anti-degenerate guard: 80+ chars of repeated filler (under 4 unique words, or one word over half the text) caps at 16 instead of scoring 40 - RB-49 calibration fixtures are unchanged; degenerate descriptions may now fall below `--threshold` gates. The false-positive contract (any callee lexically ending in `tool(`, renamed/wrapped calls invisible) is now documented in the module header and README.

### Patch Changes

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - `no-secret-unwrap` gains an opt-in `allowReceiverPattern` option for the documented collision with Zod's `.unwrap()` (ZodOptional/ZodNullable/ZodDefault) and Rust-style result libraries: when the source text of the receiver expression matches the pattern, both `unwrap` and `reveal` reports are skipped, so `['error', { allowReceiverPattern: 'Schema$' }]` lets schema-introspection code lint clean while `secret.unwrap()` keeps erroring. Default behaviour is byte-identical (no pattern, sharp deprecation cliff), and there is deliberately no built-in "looks like Zod" heuristic - an explicit narrow pattern or a file-glob override beats a nondeterministic guess. README documents both recipes.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

## 0.6.0

### Patch Changes

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Retarget stale security rules to the current API surface (audit 2026-07-04 Wave E, cluster E1). `no-secret-in-deps` matched the pre-0.5 `Agent.toTool({ inheritSecrets })` shape that no longer exists (the rule could never fire); it now matches the real DEC-137 grant point, `withChildToolSecretsContext({ secretsAllowed: [...] })`, still requiring the `rb-24-justification` comment. `no-implicit-network-call` regains parity with `scripts/check-no-network.mjs` (EB-10): undici/got namespace calls, raw `net`/`tls`/`dgram` sockets, `new WebSocket`/`EventSource`, and static/dynamic/`require()` imports of HTTP clients are now flagged. Stale "scaffolds for the eventual public ruleset" package description replaced; the removed `no-console-in-public-api` row dropped from the README.

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Release-pipeline and tarball-surface fixes (audit 2026-07-04 Wave E, cluster E2). `@graphorin/memory`'s `./conflict` subpath was runtime-EMPTY on npm 0.5.0 (`export { };` - preserveModules emitted the module without an explicit tsdown entry); it now ships all 8 runtime exports. `@graphorin/server`'s internal `workspace:*` peer dependencies are ranged (`workspace:>=0.5.0 <1.0.0`) so changesets stops escalating every sibling bump into a bogus MAJOR for the whole fixed group (the 1.0.0 landmine on the release bot's branch). `@graphorin/eslint-plugin` gains the `./package.json` self-export. All 27 per-package CHANGELOGs gain the 0.5.0 section (they were frozen at 0.1.0 inside every published tarball), and the `mvp-readiness` release gate now rejects a stale-CHANGELOG or unresolvable-exports release.

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial scaffold for the Graphorin ESLint plugin. Ships an empty rule set
  and a single no-op rule (`no-console-in-public-api`) used to verify that
  the plugin loads correctly in a host project. The full ruleset lands in a
  later release.
