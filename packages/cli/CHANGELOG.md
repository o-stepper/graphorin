# @graphorin/cli

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- [#225](https://github.com/o-stepper/graphorin/pull/225) [`a1e5154`](https://github.com/o-stepper/graphorin/commit/a1e515442786b0dc448067e9f994b72fbf8b6a5f) Thanks [@o-stepper](https://github.com/o-stepper)! - `graphorin start` can now serve the full domain surface. A new `app` config field points at a compose module; the launcher imports it, calls the default-exported factory (typed as `GraphorinAppFactory` in `@graphorin/server`, with `GraphorinAppContext` / `GraphorinAppBag` alongside) and spreads the returned adapter bag into `createServer(...)`, mounting sessions / memory / agents / workflows instead of the bare infrastructure daemon. The bag's optional `close` hook runs after `server.stop()` on shutdown. `graphorin init --app` scaffolds a working `graphorin.app.mjs` (SQLite store + memory + sessions REST adapters over the configured storage) and wires the config field; the scaffold is boot-tested in CI.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6), [`a1e5154`](https://github.com/o-stepper/graphorin/commit/a1e515442786b0dc448067e9f994b72fbf8b6a5f)]:
  - @graphorin/core@0.13.5
  - @graphorin/eslint-plugin@0.13.5
  - @graphorin/memory@0.13.5
  - @graphorin/provider@0.13.5
  - @graphorin/security@0.13.5
  - @graphorin/server@0.13.5
  - @graphorin/store-sqlite@0.13.5
  - @graphorin/pricing@0.13.5
  - @graphorin/sessions@0.13.5
  - @graphorin/skills@0.13.5
  - @graphorin/workflow@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171), [`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/pricing@0.13.4
  - @graphorin/provider@0.13.4
  - @graphorin/security@0.13.4
  - @graphorin/memory@0.13.4
  - @graphorin/sessions@0.13.4
  - @graphorin/store-sqlite@0.13.4
  - @graphorin/server@0.13.4
  - @graphorin/skills@0.13.4
  - @graphorin/workflow@0.13.4
  - @graphorin/core@0.13.4
  - @graphorin/eslint-plugin@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/provider@0.13.3
  - @graphorin/security@0.13.3
  - @graphorin/memory@0.13.3
  - @graphorin/sessions@0.13.3
  - @graphorin/store-sqlite@0.13.3
  - @graphorin/server@0.13.3
  - @graphorin/skills@0.13.3
  - @graphorin/workflow@0.13.3
  - @graphorin/core@0.13.3
  - @graphorin/eslint-plugin@0.13.3
  - @graphorin/pricing@0.13.3

## 0.13.2

### Patch Changes

- [#213](https://github.com/o-stepper/graphorin/pull/213) [`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425) Thanks [@o-stepper](https://github.com/o-stepper)! - `graphorin init` next-step hints (`graphorin migrate --config ...` / `graphorin start --config ...`) now shell-quote the config path, so pasting them literally works from directories with spaces or apostrophes instead of failing with "config file not found" at the truncated path. Quoting is per platform family (POSIX single quotes with the `'\''` idiom; double quotes on Windows, where the backslash path separator itself stays unquoted); ordinary paths pass through untouched.

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/memory@0.13.2
  - @graphorin/pricing@0.13.2
  - @graphorin/provider@0.13.2
  - @graphorin/security@0.13.2
  - @graphorin/server@0.13.2
  - @graphorin/sessions@0.13.2
  - @graphorin/skills@0.13.2
  - @graphorin/store-sqlite@0.13.2
  - @graphorin/workflow@0.13.2
  - @graphorin/eslint-plugin@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4), [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/pricing@0.13.1
  - @graphorin/core@0.13.1
  - @graphorin/eslint-plugin@0.13.1
  - @graphorin/memory@0.13.1
  - @graphorin/provider@0.13.1
  - @graphorin/security@0.13.1
  - @graphorin/server@0.13.1
  - @graphorin/sessions@0.13.1
  - @graphorin/skills@0.13.1
  - @graphorin/store-sqlite@0.13.1
  - @graphorin/workflow@0.13.1

## 0.13.0

### Patch Changes

- [#206](https://github.com/o-stepper/graphorin/pull/206) [`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034) Thanks [@o-stepper](https://github.com/o-stepper)! - Two deep-retest (2026-07-19) fixes to the operator onboarding path:

  - **`graphorin init --cloud-consent` is now actionable (P1-4).** The chosen tier used to land only as a `.ts` comment (and vanish entirely from the JSON flavour). `init` now prints the exact `createMemory({ contextEngine: { privacy: ... } })` snippet that ENFORCES the tier as step 5 of the next-steps, and the `.ts` config embeds the same code - both flavours hand the operator the real wiring instead of a decorative choice (memory is composed in code, so the server config genuinely cannot enforce it).
  - **`doctor --all` no longer false-fails on a disabled audit log (P2-1).** A config-driven `doctor` now reports the audit-encryption check as `skip` when the supplied config has `audit.enabled: false`, instead of failing on a binding the disabled subsystem never needs. `checkEncryption(...)` in `@graphorin/security` gains an optional `{ auditEnabled }` argument; the internal "Phase 05" jargon is dropped from the hint.

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034), [`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/security@0.13.0
  - @graphorin/pricing@0.13.0
  - @graphorin/server@0.13.0
  - @graphorin/memory@0.13.0
  - @graphorin/skills@0.13.0
  - @graphorin/provider@0.13.0
  - @graphorin/sessions@0.13.0
  - @graphorin/core@0.13.0
  - @graphorin/eslint-plugin@0.13.0
  - @graphorin/store-sqlite@0.13.0
  - @graphorin/workflow@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies [[`ca53c34`](https://github.com/o-stepper/graphorin/commit/ca53c34749c1a90268c659f87f57a58ae7d266ff)]:
  - @graphorin/provider@0.12.1
  - @graphorin/core@0.12.1
  - @graphorin/eslint-plugin@0.12.1
  - @graphorin/memory@0.12.1
  - @graphorin/pricing@0.12.1
  - @graphorin/security@0.12.1
  - @graphorin/server@0.12.1
  - @graphorin/sessions@0.12.1
  - @graphorin/skills@0.12.1
  - @graphorin/store-sqlite@0.12.1
  - @graphorin/workflow@0.12.1

## 0.12.0

### Patch Changes

- [#195](https://github.com/o-stepper/graphorin/pull/195) [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7) Thanks [@o-stepper](https://github.com/o-stepper)! - `graphorin token revoke` and `graphorin token rotate` now print a propagation note: the CLI writes the token store directly, so a running server may keep honoring the token for up to its verifier-cache TTL (default 60s); revoke via `DELETE /v1/tokens/:id` on the live server (which evicts the cache synchronously) or restart it for immediate effect.

- Updated dependencies [[`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7), [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7), [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7)]:
  - @graphorin/server@0.12.0
  - @graphorin/store-sqlite@0.12.0
  - @graphorin/memory@0.12.0
  - @graphorin/sessions@0.12.0
  - @graphorin/workflow@0.12.0
  - @graphorin/core@0.12.0
  - @graphorin/eslint-plugin@0.12.0
  - @graphorin/pricing@0.12.0
  - @graphorin/provider@0.12.0
  - @graphorin/security@0.12.0
  - @graphorin/skills@0.12.0

## 0.11.0

### Minor Changes

- [#193](https://github.com/o-stepper/graphorin/pull/193) [`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31) Thanks [@o-stepper](https://github.com/o-stepper)! - `graphorin doctor --smoke-local` - the local-first first-run smoke (external audit 2026-07-16, item 6). Exercises the exact stack a new local deployment depends on, through the same code paths the framework uses at runtime: the native SQLite stack (`better-sqlite3` binding + `sqlite-vec`, with the pnpm-10 skipped-build failure surfaced as the actionable `SqliteNativeBindingError` hint), a write / close / reopen / search round-trip against a throwaway store (FTS-only, no models needed), Ollama daemon reachability and model inventory (`--ollama-model` asserts presence), one real `/api/embed` probe reporting the embedding dimension (`--embed-model`, default `nomic-embed-text`), and - with `--ollama-model` - a streamed tool-call round-trip through the real `ollamaAdapter` (`think: false`) that reports the server's load / prompt-eval / generation timings. An unreachable daemon degrades to warn + skip so storage-only machines still get a verdict. `--smoke-local` alone runs only the smoke; it composes with `--check-*` / `--all` and is deliberately not implied by `--all` (CI hosts without a daemon keep `--all` unchanged).

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/provider@0.11.0
  - @graphorin/memory@0.11.0
  - @graphorin/pricing@0.11.0
  - @graphorin/security@0.11.0
  - @graphorin/server@0.11.0
  - @graphorin/sessions@0.11.0
  - @graphorin/skills@0.11.0
  - @graphorin/store-sqlite@0.11.0
  - @graphorin/workflow@0.11.0
  - @graphorin/eslint-plugin@0.11.0

## 0.10.2

### Patch Changes

- [#191](https://github.com/o-stepper/graphorin/pull/191) [`072687d`](https://github.com/o-stepper/graphorin/commit/072687d3a80d312cec885b282b5fbf8a287aaa05) Thanks [@o-stepper](https://github.com/o-stepper)! - docs(cli): guard --help says five tiers; memory.ts header drops the stale migration-state claim

  `graphorin guard status --help` still said "the four guard tiers" (the
  `MemoryGuardTier` union has five members; the guide and `guard/types.ts` were
  already corrected). Also the `memory.ts` module header still promised "counts +
  active embedder + migration state" for `memory status`, which does not report
  migration state. Help-string and comment changes only; no behaviour change.

- [#190](https://github.com/o-stepper/graphorin/pull/190) [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(cli): MEMORY-CL-02 `memory review --promote` emits a JSON error on failure

  `review --promote <bad-id> --json` exited 1 with empty stdout, so `--json`
  consumers got no structured payload. The failure paths (not-quarantined and
  injection-refused) now carry an `error { code, message }` on the result and emit
  it through the JSON sink, matching the `secrets get` miss contract.

- [#190](https://github.com/o-stepper/graphorin/pull/190) [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(cli): OPERATOR-01 `triggers prune` requires --before

  The prune help promised a bare invocation would "drop every disabled row", but
  the epoch-0 default cutoff made it a no-op for every dated row. `--before` is
  now a required option (mirroring `audit prune` / `traces prune`) and the help
  text describes the real behaviour.

- [#190](https://github.com/o-stepper/graphorin/pull/190) [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(cli): SECRETS-S-03/04 honour ref flags and detect read-only writes

  - SECRETS-S-03: `secrets ref` now threads `--secrets-source` / `--strict-secrets`
    and activates the requested store before resolving, so `ref:` URIs resolve
    through the chosen store instead of failing with "No active SecretsStore".
  - SECRETS-S-04: `secrets set` reads the value back after writing and fails loudly
    when the active store is read-only (e.g. the env resolver), instead of
    reporting ok:true / exit 0 for a write that never persisted.

- Updated dependencies []:
  - @graphorin/server@0.10.2
  - @graphorin/memory@0.10.2
  - @graphorin/sessions@0.10.2
  - @graphorin/core@0.10.2
  - @graphorin/eslint-plugin@0.10.2
  - @graphorin/pricing@0.10.2
  - @graphorin/security@0.10.2
  - @graphorin/skills@0.10.2
  - @graphorin/store-sqlite@0.10.2
  - @graphorin/workflow@0.10.2

## 0.10.1

### Patch Changes

- [#187](https://github.com/o-stepper/graphorin/pull/187) [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051) Thanks [@o-stepper](https://github.com/o-stepper)! - fix(cli): TOOL-AUDI-02 audit export enforces mode 0600 on a pre-existing file

  `graphorin audit export` printed "(mode 0600)" but `writeFile`'s `mode` only
  applies when it creates the file - re-exporting over an existing world-readable
  file left it at its old mode. The command now `chmod`s the target to 0600 after
  every write (a no-op on Windows, which has no POSIX mode bits).

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - Raw-token stdout parity for `token rotate` / `token rekey` (e2e 2026-07-13, CLI-01) - `token create` moved its one-time raw value to stdout in S-14b ("machine-consumable output"), but rotate and rekey kept printing theirs to stderr, so `TOKEN=$(graphorin token rotate <id>)` captured nothing. Both now print raw values to stdout while the log chatter stays on stderr, and the `stdoutPrint` test seam moves to `TokenCommonOptions`. Also `memory status` no longer promises "migration state" in its `--help` (CLI-02) - the command reports counts + active embedder.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix three CLI defects (e2e 2026-07-13/16). CLI-03 (major): `graphorin memory migrate --strategy <typo>` was cast without validation and fell through to the destructive auto-migrate branch (all facts re-embedded, source embedder retired) with exit 0; the strategy is now validated up front and an unknown value exits UNSUPPORTED with a clear message. AUTH-CLI-01 (major): `graphorin auth revoke` ignored `GRAPHORIN_OFFLINE=1` and made an outbound RFC 7009 POST carrying the live token; it now honours offline mode and refuses like `auth login` / `auth refresh`, matching the documented "no implicit network calls" contract. MEMORY-CL-01 (major): `graphorin memory why` and the `memory review` listing path (both documented read-only) auto-migrated a schema-behind live database, violating the W-068 invariant that `inspect` / `activity` already uphold; they now run with `migrationPolicy: 'check'` and refuse to upgrade a live DB (`review --promote`, an explicit write, keeps the migrate policy). Regression tests added for each.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the encrypted-file secrets store never activating from the CLI (e2e 2026-07-16, SECRETS-S-02, major). `createSecretsStore({ kind: 'encrypted-file' })` requires an explicit `encryptedFile: { path, passphrase }`, but the CLI's `openStore` forwarded only `kind` / `strict`, and `GRAPHORIN_MASTER_PASSPHRASE` was never consulted - so `graphorin secrets ... --secrets-source encrypted-file` (and the `auto` chain's encrypted-file leg) failed as "unavailable" and long-lived keys could not be stored on a headless host. The CLI now builds the encrypted-file config from the environment: the passphrase from `GRAPHORIN_MASTER_PASSPHRASE` and the bundle path from `GRAPHORIN_SECRETS_FILE` (defaulting to `~/.graphorin/secrets.enc`). Regression test round-trips a secret through the encrypted-file store (skipped where the `@node-rs/argon2` peer is absent).

- Updated dependencies [[`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/memory@0.10.1
  - @graphorin/core@0.10.1
  - @graphorin/security@0.10.1
  - @graphorin/store-sqlite@0.10.1
  - @graphorin/server@0.10.1
  - @graphorin/sessions@0.10.1
  - @graphorin/workflow@0.10.1
  - @graphorin/pricing@0.10.1
  - @graphorin/skills@0.10.1
  - @graphorin/eslint-plugin@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies [[`214c20f`](https://github.com/o-stepper/graphorin/commit/214c20f1b2dc7463b683a86f50bc6b10c11ca3f0)]:
  - @graphorin/store-sqlite@0.10.0
  - @graphorin/memory@0.10.0
  - @graphorin/server@0.10.0
  - @graphorin/sessions@0.10.0
  - @graphorin/workflow@0.10.0
  - @graphorin/core@0.10.0
  - @graphorin/eslint-plugin@0.10.0
  - @graphorin/pricing@0.10.0
  - @graphorin/security@0.10.0
  - @graphorin/skills@0.10.0

## 0.9.0

### Minor Changes

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Resumable embedder migration, real CLI migrate, KNN fallback and space reclaim (wave-D D5, plan item 10 steps 3-4; MST-12 and N-2 closed). The dead `migration_state` table is revived as a persisted cross-process cursor (`store.embedderMigration.state`); `migrateEmbedder({ state })` records progress after every batch and RESUMES from the cursor on the next invocation - kills and explicit aborts both stay resumable. The store now ships the `nextBatch` pager the runner always lacked (`store.embedderMigration.nextBatch`: pages live facts/episodes, re-embeds into the target sidecar, deletes the source row, flips `embedder_id`). `graphorin memory migrate --from --to --strategy --embedders <module>` is real (local factory-module import per DEC-154, `--batch-size`, `--json`), and `--reclaim` drops retired embedders' vector sidecar tables + runs `PRAGMA incremental_vacuum` (`store.embedderMigration.dropRetiredVectorTables()`). `SqliteVecMissingError` softens into policy: `createSqliteStore({ onMissingSqliteVec: 'linear-fallback' })` serves vectors from plain sidecar tables with a batched in-process cosine KNN (`setImmediate` yields, vec0 top-k parity pinned by test); a database stays in ONE mode, guarded both ways with actionable errors. The storage guide gains the migration/reclaim runbook and a `memory migrate` row in the live-server concurrency matrix.

- [#177](https://github.com/o-stepper/graphorin/pull/177) [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f) Thanks [@o-stepper](https://github.com/o-stepper)! - Workflow durability tail (wave-E E2, plan item 16). `fork(threadId, fromCheckpointId, { patch })` merges channel-level values into the forked root's state ("branch here, but with these corrected values"): patch keys must name declared channels and the merged state re-runs the WF-10 JSON-safety guard; over HTTP the same patch is the optional `state` field of `POST /v1/workflows/:id/fork`. New read-only inspection helpers `readThreadState(store, workflowName, threadId)` / `listThreadCheckpoints(...)` decode a thread's latest checkpoint (status, unwrapped channel state, the full pending-pause frontier) and its timeline off a bare `CheckpointStore` by workflow NAME - and back the new operator commands `graphorin workflow inspect <threadId> --workflow <name>` and `graphorin workflow checkpoints <threadId> --workflow <name>` (read-only, exit 1 on unknown thread). The cross-process durability invariant is now pinned end-to-end: a thread suspended on an approval in a SIGKILLed process resumes from SQLite in a fresh one. `multiResume` intentionally not built (decision D-2).

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/memory@0.9.0
  - @graphorin/server@0.9.0
  - @graphorin/store-sqlite@0.9.0
  - @graphorin/core@0.9.0
  - @graphorin/workflow@0.9.0
  - @graphorin/security@0.9.0
  - @graphorin/sessions@0.9.0
  - @graphorin/pricing@0.9.0
  - @graphorin/skills@0.9.0
  - @graphorin/eslint-plugin@0.9.0

## 0.8.0

### Minor Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - CLI e2e remediation cluster (2026-07-11). `tools lint` now honours its documented exit-2 contract: a missing/unreadable/unparseable `--config` (and one without `include[0]`) fails hard with a clear stderr message instead of silently falling back to the default glob, walker/compileGlob failures exit 2 instead of 1, the tsconfig comment stripper is string-aware (an include such as `"lib/**/*.ts"` is no longer mangled into `lib*.ts`), and the glob compiler translates `**/` and trailing `/**` with standard globstar semantics so `src/**/*.ts` matches files directly in `src/` (E-04, E-20). All `triggers` subcommands (`status`/`fire`/`disable`/`prune`) now run with migrationPolicy `check` like `list`, so they refuse instead of auto-migrating a behind-schema database (E-13). `skills migrate-frontmatter` dry-run now lists the files `--apply` would rewrite instead of always printing "no rewrites required" (E-14). `storage status` probes the cipher peer through the `@graphorin/store-sqlite-encrypted` sub-pack's own loader, so it agrees with what `encrypt`/`rekey` can actually do under pnpm's strict layout (E-10). `doctor` gains `--config <path>` to check the configured storage/audit paths instead of only the hardcoded `~/.graphorin` layout (F-06), and `init` gains `--format ts|json` (default `ts`; a `.json` `--out` implies `json`) emitting a defineConfig-free plain JSON config, with the `.ts` resolution constraint documented (F-05). Minor fixes: `audit verify` with audit disabled no longer doubles the `[graphorin/cli]` prefix and emits a structured `{ ok: false, error }` JSON document on the `--json` error path; `storage backup` mirrors the source file mode onto the copy (a 0600 store no longer yields a 0644 backup); BEHAVIOR CHANGE: `token create` prints the raw token line to stdout (log chatter stays on stderr) so `TOKEN=$(graphorin token create ...)` works; `migrate-export` preserves the `--hash` body checksum of hashed exports and its unsupported-schema error no longer claims "v0.1".

### Patch Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Serialize per-token USD rates in `graphorin pricing lookup --json` in a stable decimal form (S-05): the snapshot stores rates as `x / 1_000_000` doubles, so the $0.10/Mtok cache-read rate printed as `1.0000000000000001e-7`. The JSON document now re-quantizes each rate to the shortest decimal whose parsed value stays within 1e-15 relative of the stored double (it prints as `1e-7`), presentation only - `lookupPrice` / `calculateCost` and the command's return value keep the raw doubles used in cost math. Adds a regression test for the `claude-haiku-4-5` entry plus a sweep asserting clean, value-identical serialization for every bundled snapshot entry.

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b), [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/memory@0.8.0
  - @graphorin/pricing@0.8.0
  - @graphorin/security@0.8.0
  - @graphorin/server@0.8.0
  - @graphorin/skills@0.8.0
  - @graphorin/store-sqlite@0.8.0
  - @graphorin/sessions@0.8.0
  - @graphorin/core@0.8.0
  - @graphorin/eslint-plugin@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-003/W-041: `graphorin init` stops printing a dead credential and stops teaching argv secrets.

  init generated and printed a "bootstrap admin token (shown ONCE)" whose hash was never persisted anywhere - verification requires an HMAC lookup in the auth-token store (migrations + pepper), and init's contract is "write the config file only" - so the token was guaranteed to 401; the working path (`graphorin token create` after `migrate`) was not even mentioned. Following the IP-4 honesty precedent, init no longer emits a token (`InitCommandResult.bootstrapToken` removed - BREAKING for scripts parsing it, though the value never worked) and the next-steps now walk the real path: (1) persist the pepper via stdin - `printf '%s' '<hex>' | graphorin secrets set graphorin_server_pepper --from-stdin`, never `--value` on argv, which parked the key material behind every token HMAC in shell history (W-041); (2) `graphorin migrate`; (3) `graphorin token create --label bootstrap` (raw token shown once, verifiable); (4) `graphorin start`. The pepper hex is still printed exactly once to stderr.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-068: migration-runner TOCTOU fence + read-only CLI commands stop auto-migrating live databases.

  `runMigrations` re-checks `schema_migrations` INSIDE each per-migration IMMEDIATE transaction: when two processes race to migrate one file, the loser now skips (no-op) instead of crashing on non-idempotent SQL ("duplicate column name"). New read-only `pendingMigrations(conn)` helper reads `sqlite_master` first, so probing a foreign database never marks it by creating the bookkeeping table. The CLI store context gains `migrationPolicy: 'apply' | 'check'`; read-only commands (`memory inspect`/`activity`, `traces status|prune`, `triggers list`, `consolidator status`/`dlq-list`) now run with `'check'`: a newer CLI pointed at a running (older) server's database refuses with "schema is N migration(s) behind ... run 'graphorin migrate' (with the server stopped) or use a CLI version matching the server" instead of silently upgrading the schema under the live process. BEHAVIOR CHANGE: those commands now also refuse on a never-migrated database instead of creating the schema as a side effect.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Reachable retention lever for `memory_history` (W-066):

  - `@graphorin/core`: new `MemoryStoreExt` contract (`extends MemoryStore` with `pruneHistory(olderThanMs)`), mirroring the `SessionStoreExt` precedent - strictly additive, custom `MemoryStore` implementations keep compiling. The TSDoc pins the unit semantics: the argument is an AGE in milliseconds, never an epoch cutoff.
  - `@graphorin/store-sqlite`: `SqliteMemoryStore` declares `implements MemoryStoreExt` and `GraphorinSqliteStore.memory` is now typed `MemoryStoreExt`, so `pruneHistory` is reachable without casts.
  - `@graphorin/cli`: new `graphorin memory prune-history --older-than <duration|date>` command. `--older-than` is mandatory (destructive by design, no default), takes a duration (`30d`, `12h`) or a PAST ISO date (converted to `now - date`; future dates are refused - they would prune the whole table). Documented in the CLI guide and the memory-system guide: history grows by design, `purge()` already scrubs sensitive text, pruning is storage-cost hygiene.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-065: lifecycle owners for four small tables. `SqliteConsolidatorStateStore` gains `pruneRuns(beforeEpochMs)` (terminal per-tick run-log rows; `status='running'` always survives) and `pruneExhaustedBatches(beforeEpochMs)` (DLQ batches parked forever with `next_retry_at IS NULL`; batches awaiting retry stay claimable). New CLI `graphorin consolidator dlq-list` / `dlq-clear` (`--exhausted-only` default true, `--before`, `--id`, `--user`) make the permanent `dead-letter queue: N` status warning actionable - operator-level, cross-user, in the same style as the existing `dlqSize` counter. `IdempotencyStore.prune`'s TSDoc now names its production caller (the server's hourly sweep). Migration 031 drops the dead `trigger_fire_log` table (created by 007, never written or read by any code; append-only discipline preserved - 007 untouched).

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Database-file compaction path (W-064). `openConnection` now declares `PRAGMA auto_vacuum = INCREMENTAL` on every database it CREATES (checked via `page_count == 0`, right after the cipher pragmas, so encrypted databases opened through the `store-sqlite-encrypted` delegate get it automatically; pre-existing databases are untouched - the pragma is a spec-guaranteed no-op there). New `graphorin storage compact` command: `wal_checkpoint(TRUNCATE)` + batched `PRAGMA incremental_vacuum` (`--batch-pages`, default 1000, keeps writer locks short) + a final checkpoint, reporting freelist before/after and reclaimed bytes. Unlike the forbidden `VACUUM`, incremental vacuum relocates free pages through the pointer map without renumbering implicit rowids, so FTS5 external-content mappings survive - covered by an integrity + search test. On a database created before this version (`auto_vacuum=0`) the command reports the high-water-mark limitation honestly and exits 0 without modifying the file; reclaiming disk there requires recreating the store. Docs: storage guide danger-block extended with the incremental-vacuum contrast, cli + deployment guides gain the command.

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-097: `graphorin pricing refresh` finally works against the dataset the docs point at. New pure converter (`convertGenaiPrices` / `isGenaiPricesShape`, exported) maps the published `@pydantic/genai-prices` dataset (providers[] -> models[] -> per-Mtok prices incl. cache read/write legs) into per-token `ModelPrice` entries; unrepresentable model entries (tiered/conditional pricing) are skipped with a counter instead of failing the refresh, and the supported subset is pinned by a vendored fixture + doc comment. `refreshPricing` gains `format: 'auto' | 'graphorin' | 'genai-prices'` (default auto: native first, then detection), stamps converted snapshots `version: 'genai-prices+converted'` with an additive `PricingSnapshot.conversion { format, skipped }`, and REJECTS a dataset declaring a non-USD currency instead of silently stamping dollars. The CLI adds `--format` and prints the skipped count; the pricing reference documents a working raw-URL example. Native-shape refreshes are byte-identical; no baked-in endpoint was added (privacy contract).

### Patch Changes

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Audit retention vs Merkle anchoring (W-062):

  - `@graphorin/security`: fixed a crash in `pruneAudit` against the shipped better-sqlite3 binding - the re-hash loop wrote through the connection while `iterate()` held a live statement iterator, throwing "This database connection is busy executing a query" whenever surviving entries needed re-rooting (the in-memory test double masked it). Survivors are now rewritten in closed-iterator batches (bounded memory). The `pruneAudit` package docs now state explicitly that verification against ANY pre-prune Merkle checkpoint fails afterwards by design, indistinguishably from a truncate-and-re-root attack. A contract test pins this behavior.
  - `@graphorin/cli`: `graphorin audit prune` prints a re-anchor reminder after every destructive prune (sign + distribute a fresh checkpoint, mark old anchors superseded).
  - Security guide: new "Retention and anchoring" runbook (prune -> sign fresh checkpoint -> distribute -> supersede old anchors -> accept anchored-history reset) plus the documented identifier-level erasure limitation of the time-prefix-only prune.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Help-text honesty sweep (W-040): `consolidator set-tier` / `consolidator stop` no longer promise persistence they never had (both report UNSUPPORTED with exit 2 and now say so, pointing at `consolidator.tier` in the config per the existing IP-4 note); `tools lint` and its module header describe the discovery as the text-based static scan it actually is, not "AST analysis". The CLI guide's `migrate-export` row/example gained the mandatory `--to <file>` (copy-paste no longer dies on "required option not specified"), the phantom `tools lint <path>` positional is gone, and the `pricing diff`/`lookup`/`missing` examples now carry their required options. The `check-cli-docs` gate grew a requiredOption pass (alias-aware, `--flag=value` aware) so this drift class fails CI from now on - it caught the three pricing examples immediately.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-012: `encryptDatabase({ swap: true })` now probes for a live writer BEFORE touching the source and refuses with the new typed `EncryptSwapLiveWriterError` when another connection holds the database. The swap path renames the source file; a running server would keep writing into the renamed `.bak.<ts>` inode, silently diverging from the encrypted copy until `storage cleanup-backups` deletes those writes. The probe (a journal-mode switch, which sqlite3mc refuses with "database is locked" under any other open connection) restores WAL in `finally`; the probe-to-rename window remains a documented best-effort residual. CLI `--swap` help and the storage guide now state the stopped-server requirement.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-002: exit codes are honored in `--json` mode. Eight commands set `process.exitCode` inside the `human()` callback of `emitReport`, which `--json` skips entirely - so exactly the machine consumers the flag exists for saw exit 0 on failure, worst of all `graphorin audit verify --json` returning 0 on a broken hash chain. The assignments are hoisted outside the callback (matching the existing doctor/tools-lint pattern) for: `audit verify`, `secrets get`, `secrets ref`, `token revoke`, `token verify`, `pricing lookup`, `skills inspect`, `triggers status`. `emitReport`'s doc now forbids side effects in `human()`. CI pipelines that (incorrectly) relied on exit 0 under `--json` on failure will now see the documented exit 1.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-007: `graphorin traces status|prune` now operates on the REAL `spans` table (migration 024) instead of a `traces` table no migration or runtime ever created. The command was a permanent no-op ("traces table not found") - an operator with `traces prune` in cron believed retention was handled while spans grew without bound. `status` reads counts + ISO time range from `start_unix_nano`; `prune` delegates to `pruneSpans` (deletes spans that FINISHED strictly before `--before`, index-backed). JSON field names (`oldestStartedAt`/`newestStartedAt`) are unchanged, so machine consumers keep working. NOTE: an existing cron `traces prune` will now actually delete old spans - that is the documented behavior finally happening.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Release-flow hardening (W-015, repo-level): the root `version` script now chains `changeset version && node scripts/bump-version.mjs --sync`, so any Version Packages pass (bot or maintainer) leaves the private workspaces and every text version site synchronized and self-verified by `check-version-consistency` in one step. `release.yml` reads `secrets.RELEASE_PAT || secrets.GITHUB_TOKEN`, giving the maintainer two documented paths (fine-grained PAT or the repo setting allowing Actions to create PRs) to restore the fully-automatic Version Packages PR; without either, the documented manual flow is unchanged. CONTRIBUTING lists the four remaining manual follow-ups.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Tool discovery and grading are comment-aware (W-044). Discovery and every grading path run over a comment-blanked view of the source (newlines preserved, offsets stable; string/template and - conservatively - regex literals untouched): a commented-out `tool({...})` no longer appears in `graphorin tools lint` reports or the three ESLint tool rules, a commented-out property inside a live literal is never extracted, a commented email inside a live `examples:` block no longer penalizes the axis, and a `tool(` inside a string never matches. `DiscoveredTool` gains `gradingSource` (the blanked slice all graders consume) while `source` keeps the original text for reports. The description axis gets a deterministic anti-degenerate guard: 80+ chars of repeated filler (under 4 unique words, or one word over half the text) caps at 16 instead of scoring 40 - RB-49 calibration fixtures are unchanged; degenerate descriptions may now fall below `--threshold` gates. The false-positive contract (any callee lexically ending in `tool(`, renamed/wrapped calls invisible) is now documented in the module header and README.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`c1af9c7`](https://github.com/o-stepper/graphorin/commit/c1af9c790757fbe82da6dd2b6c1fdc497b5c605e), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3), [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/security@0.7.0
  - @graphorin/server@0.7.0
  - @graphorin/store-sqlite@0.7.0
  - @graphorin/memory@0.7.0
  - @graphorin/eslint-plugin@0.7.0
  - @graphorin/pricing@0.7.0
  - @graphorin/sessions@0.7.0
  - @graphorin/skills@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1
  - @graphorin/eslint-plugin@0.6.1
  - @graphorin/memory@0.6.1
  - @graphorin/pricing@0.6.1
  - @graphorin/security@0.6.1
  - @graphorin/server@0.6.1
  - @graphorin/sessions@0.6.1
  - @graphorin/skills@0.6.1
  - @graphorin/store-sqlite@0.6.1

## 0.6.0

### Patch Changes

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Store durability and data lifecycle (audit 2026-07-04 Wave B, cluster B7).

  - store-02: new `graphorin storage backup <dest>` - online, consistent copy via the driver's page-level `backup()` API (safe under a live writer, preserves rowids so FTS5 mappings survive, encrypted stores produce an equally-encrypted copy). `deployment.md` stops recommending the non-existent `BACKUP TO` and explicitly warns against `VACUUM INTO`.
  - store-03: episode vector KNN gains the MRET-9 over-fetch loop facts already had (shared `widenKnn` helper) - a minority user's episodic recall is no longer starved to zero by a dominant user's vectors.
  - store-04: GDPR `purge()` scrubs the fact's text out of `memory_history` (both rows keyed to the id and value-matching rows - a SUPERSEDE row carries the new fact's text on the OLD id) inside the same transaction, keeping the event skeleton; new `SqliteMemoryStore.pruneHistory(olderThanMs)` retention API bounds the otherwise-unbounded table.
  - store-05: `encryptDatabase` copies via the driver's online backup API instead of checkpoint-close-then-copyFileSync - a concurrent writer can no longer commit WAL frames that silently miss the encrypted copy.
  - store-06: every write transaction now BEGINs IMMEDIATE, eliminating the SQLITE_BUSY_SNAPSHOT class on read-then-write transactions under server+CLI concurrency (busy_timeout waits instead).
  - store-07: `upsertState` builds its UPDATE from the supplied patch keys only (insert-if-absent + patch, in one immediate transaction) and `releaseLock` is a single conditional UPDATE - a concurrently acquired consolidator lock can no longer be silently reverted.
  - store-13: migration 025 adds partial indexes on `facts.supersedes` / `facts.superseded_by`, so `historyOf` chain walks stop scanning the user's facts per node; registry owner map backfilled for 024/025.
  - store F13: `distanceMetric: 'dot'` is coerced to `'cosine'` at registration with a loud warning (the vec0 table never computed dot; the meta now matches reality).

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix `graphorin storage cleanup-backups` being a silent no-op on Windows (audit 2026-07-04 Wave E, cluster E6): the DB base name was derived via `dbPath.split('/')`, which on backslash-separated Windows paths returned the whole path so no directory entry ever matched. Now uses `node:path` `basename`/`join`. Also documents the supported-platforms matrix (the one genuine ARM gap: `sqlite-vec` ships no `windows-arm64` binary, so vector search is unavailable on Windows-on-ARM while FTS recall keeps working).

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/memory@0.6.0
  - @graphorin/store-sqlite@0.6.0
  - @graphorin/core@0.6.0
  - @graphorin/skills@0.6.0
  - @graphorin/server@0.6.0
  - @graphorin/pricing@0.6.0
  - @graphorin/security@0.6.0
  - @graphorin/eslint-plugin@0.6.0
  - @graphorin/sessions@0.6.0

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
