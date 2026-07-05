# @graphorin/sessions

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
