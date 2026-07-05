# @graphorin/eslint-plugin

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
