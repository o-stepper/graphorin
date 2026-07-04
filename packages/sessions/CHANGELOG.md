# @graphorin/sessions

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Phase 11 — initial release of `@graphorin/sessions`. Ships the
  hybrid `createSession()` facade that wraps `@graphorin/memory.session`
  for message CRUD (single source of truth), the `AgentRegistry`
  singleton with `register / retire / delete / resolveOrPlaceholder`,
  automatic handoff records with input-filter + secrets-inheritance
  metadata, workflow-run attachments, the JSONL session export
  schema 1.0 (`graphorin-session-export/1.0` — sentinel header +
  footer, N-2 backwards-compat, lenient-forward-parse, opt-in
  `--hash` / `--encrypt`), the tool cassette schema 1.0
  (`graphorin-tool-cassette/1.0`) with the substitution-vs-live
  replay policy honouring per-tool `sideEffectClass`, sanitized-by-
  default replay with audit + 30-day TTL + `traces:read[:sanitized
  |:raw]` scopes, and per-message commentary-phase trace
  sanitization at the session-output boundary.
