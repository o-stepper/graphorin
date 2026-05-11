---
'@graphorin/skills': minor
---

Phase 08 — typed skills surface. The new `@graphorin/skills` package
joins the Graphorin framework on top of the foundations from Phase 02
(`@graphorin/core`), Phase 03 (`@graphorin/security`), and Phase 07
(`@graphorin/tools`). After this phase the agent runtime, the
standalone server, the CLI, and any consumer codebase can load
`SKILL.md` skills with three-tier progressive disclosure, supply-chain
hardening, sandbox-tier propagation for untrusted skills, and the
`graphorin-*` namespaced extensions defined by ADR-003 / ADR-043.

`@graphorin/skills` ships:

- **Loader** — `loadSkillFromSource(...)` and `loadSkills(...)`
  resolve four source kinds:
  - `'folder'`     — read SKILL.md and walk the directory lazily.
  - `'inline'`     — caller supplies the manifest, resources, and
    optional pre-built `Tool[]`.
  - `'npm-package'` — install via the supply-chain helper from
    `@graphorin/security/supply-chain` with `--ignore-scripts`
    enforced and a verifiable ed25519 signature required, then
    read.
  - `'git-repo'`   — shallow-clone via the supply-chain helper
    with the same guarantees.
  Three-tier loading: `Skill.metadata` is parsed at load time;
  `Skill.body()` reads the markdown body lazily and caches it;
  `Skill.resources()` lists resources lazily and only reads each
  file's bytes when `SkillResource.read()` is invoked.
- **Frontmatter validator** — implements the field-resolution
  algorithm (`anthropic-base > metadata.graphorin.* > graphorin-*
  legacy > fallback`) and the conflict policy (`'warn' | 'error' |
  'silent'`, default `'warn'`) from ADR-043. Surfaces every
  diagnostic through the typed `FrontmatterDiagnostic[]` contract so
  callers (loader, CLI, audit emitter) can branch without re-parsing
  human messages. Validates required fields (`name`, `description`),
  experimental-field WARNs (`allowed-tools`), spec-snapshot author
  hints, runtime-compat semver ranges, and the
  `unknown-field-policy` (`'preserve' | 'reject' | 'warn'`,
  default `'preserve'`).
- **Bundled spec snapshot** — `anthropic-spec-snapshot.json`
  records the upstream `SKILL.md` packaging-format spec the loader
  recognises plus the `graphorin-*` extension catalogue and its
  per-field migration policy
  (`'deprecate-graphorin-prefix' | 'co-exist' | 'graphorin-only'`).
- **Four trust levels** — Phase 08's deliverable list adds
  `'unknown'` to the `'trusted' | 'trusted-with-scripts' |
  'untrusted'` ladder from `@graphorin/security/supply-chain`.
  Skills that did not declare `graphorin-trust-level` resolve to
  `'unknown'` (default-deny posture per Phase 08 § Risks &
  mitigations); the sandbox tier resolver applies the strict
  `worker-threads + no-net + no-fs` policy for `'unknown'` AND
  `'untrusted'`; the supply-chain installer treats `'unknown'` like
  `'untrusted'` for `--ignore-scripts` enforcement so a skill cannot
  silently relax the policy by omitting the field.
- **`SkillRegistry`** — `createSkillRegistry()` with
  `register / unregister / getSkill / has / list / size / clear`,
  plus `getMetadata()` (every Tier-1 metadata record) and
  `getAutoActivationMetadata()` (excludes
  `disable-model-invocation: true` skills). `getMetadataBlock()`
  renders the auto-activation metadata into a deterministic system-
  prompt block (`# Available skills` ⟶ per-skill `## name` ⟶
  description ⟶ optional cues) the ContextEngine layered template
  consumes verbatim. `resolveTrigger(raw)` routes a raw trigger
  through the slash-command parser (`/skill:<name>`) or the
  auto-activation grammar; slash-command triggers always override
  `disable-model-invocation`. `search(triggers)` returns every skill
  whose name OR description contains all of the supplied trigger
  tokens (case-insensitive). `tools()` returns the deduplicated
  union of pre-built tools across registered skills (first
  registration wins; collision logs a one-time WARN).
  `toolDeclarations()` returns every declared tool entry stamped
  with the owning skill's name + trust level so the agent runtime
  can register the actual `Tool[]` records into `@graphorin/tools`
  with the correct provenance.
- **Tool bridge** — `stampSkillTool(...)` resolves the skill's
  `ResolvedSandboxPolicy` via `@graphorin/security/sandbox`'s
  `resolveSandbox(...)`, propagates the mandatory `worker-threads
  + no-net + no-fs` tier for `'untrusted'` AND `'unknown'` skills,
  defaults the inbound-sanitization policy to
  `'detect-and-strip-and-wrap'` for both, and returns a frozen
  `Tool` + `ToolSource` pair the runtime feeds into the registry.
- **Slash-command parser** — `parseSlashCommand` accepts
  `/skill:<name>` and `/skill:<name> <free-form-args>` with leading
  whitespace tolerated; rejects bodies whose name does not match
  `/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/`.
- **`requireHandoffInputFilter`** — the Phase 12 helper used by the
  agent runtime. Returns the declared filter for trusted /
  trusted-with-scripts skills and falls through to the bounded
  framework default (`lastN(10)`); for untrusted / unknown skills
  the helper throws `InputFilterRequiredError` when the declaration
  is missing AND coerces a declared `'full'` filter back to
  `'lastUser'` (ADR-040 `filters.full()` rejection rule).
- **`migrateFrontmatter`** — idempotent dry-run/apply rewrite that
  promotes `graphorin-*` fields onto their upstream equivalents per
  the bundled mapping table. Re-running on an already-migrated
  manifest returns `changed: false`. The migrator never silently
  overwrites an already-set Anthropic-base field — operators are
  expected to remove the redundant `graphorin-*` field after
  reviewing the diagnostic.
- **`pnpm run check-anthropic-spec`** — the CI helper now diffs the
  bundled snapshot against an operator-supplied upstream snapshot
  (`--upstream <path>` or `GRAPHORIN_UPSTREAM_SPEC_PATH`). Drift is
  reported per added / removed / changed field; a `0` exit code
  indicates no drift; a `1` exit code surfaces the diff for
  maintainer review. When no upstream snapshot is supplied the
  helper exits 0 with a notice (no implicit network call).
- **Typed errors** — `SkillFrontmatterConflictError`,
  `SkillManifestParseError`, `SkillRuntimeCompatError`,
  `SkillRequiredFieldMissingError`, `InputFilterRequiredError`,
  `SkillLoadError`, `SkillNameCollisionError`,
  `SlashCommandParseError`. Every error carries a stable
  lowercase `kind` discriminator and an optional `hint` field with
  an actionable remediation step.

`pnpm test` — 99 new tests across the `@graphorin/skills` package
covering: every conflict-policy mode; field-resolution priority;
required-field detection; experimental + spec-snapshot diagnostics;
runtime-compat range satisfaction; `'preserve' | 'warn' | 'reject'`
unknown-field policy; slash-command grammar; loader three-tier
discipline (metadata-only access does not read body or resources);
inline-skill testability; `'unknown'` trust-level sandbox + ACL
propagation; `getMetadataBlock` / `search` / `tools` registry
contract; `migrateFrontmatter` dry-run + apply + idempotence;
canonical reference SKILL.md fixture loads with zero
graphorin-specific changes; `'full'` filter rejection for untrusted
skills; allowlist short-circuit + denylist `SkillInstallDeniedError`
both in isolation AND through the loader entry point; signature
verification (valid pass / tampered fail / non-ed25519 key
rejected); npm install path forwards `--ignore-scripts` AND
`npm_config_ignore_scripts=true` for both `'untrusted'` and
`'trusted'` levels; `'trusted-with-scripts'` honoured for folder
sources but rejected for npm/git sources;
`check-anthropic-spec` script PASS / FAIL paths with a mocked
upstream snapshot. The workspace passes 1604 tests across 14
packages with 0 failures and no implicit network calls
(`pnpm run check-no-network: PASS`).
