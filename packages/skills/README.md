# @graphorin/skills

> Skills surface for the Graphorin framework.

`@graphorin/skills` ships the loader, registry, validator, and
migration library that let a Graphorin agent consume skills written
to the `SKILL.md` packaging format with three-tier progressive
disclosure plus the Graphorin-specific extensions namespaced under
the `graphorin-*` prefix.

## Highlights

- **Compatibility-first loader.** A skill written to the public
  `SKILL.md` packaging format loads in Graphorin without
  modification. Author-time fields under the `graphorin-*` prefix and
  the spec-recommended `metadata.graphorin.*` bucket are honoured
  through a deterministic field-resolution algorithm (Anthropic-base
  > `metadata.graphorin.*` > `graphorin-*` legacy > caller fallback).
- **Three-tier progressive disclosure.** Metadata (Tier 1) is parsed
  at load time. The skill body (Tier 2) is read on first
  `Skill.body()` call. Resources (Tier 3) are listed lazily and the
  bytes are only read when `SkillResource.read()` is invoked.
- **Conflict policy.** Direct collisions (Anthropic-base set + the
  matching `graphorin-*` set) honour the operator-resolved
  `conflictPolicy` (`'warn' | 'error' | 'silent'`); the default is
  `'warn'`. The validator returns a typed `FrontmatterDiagnostic[]`
  so callers can route the report to logs, audit, or CI.
- **Spec-snapshot tracking.** A bundled
  `anthropic-spec-snapshot.json` records the upstream fields the
  framework recognises and the migration policy for every
  `graphorin-*` extension. The `pnpm run check-anthropic-spec` helper
  diffs the snapshot against a maintainer-supplied upstream snapshot
  (`--upstream <path>`) so new fields can be promoted with a clear
  changelog entry; it runs manually or via the release `mvp-readiness`
  gate (no scheduled job, no auto-refresh).
- **Supply-chain aware.** Loading from `npm-package` and `git-repo`
  sources delegates to the supply-chain helpers in
  `@graphorin/security` so untrusted skills install with
  `--ignore-scripts` enforced and a verifiable ed25519 signature is
  required before the loader trusts the bytes. Local `folder`
  installations remain trusted-by-default but inherit the same
  validation pipeline.
- **Slash-command activation.** `/skill:<name>` parses into a
  structured activation request the agent runtime consumes alongside
  the model-emitted auto-activation requests; skills that opt out via
  `disable-model-invocation: true` are excluded from auto-activation
  but remain reachable through the slash command.
- **Migration library.** `migrateFrontmatter()` is idempotent and
  dry-run by default. Re-running the migrator on an already-migrated
  manifest returns `changed: false`.

## Stable sub-paths

```ts
// Loader (folder / npm-package / git-repo / inline sources).
import { loadSkills, loadSkillFromSource } from '@graphorin/skills/loader';

// Registry (auto-activation metadata + slash-command resolver +
// trust-level-aware tool-declaration listing).
import { createSkillRegistry } from '@graphorin/skills/registry';

// Frontmatter validator + field-resolution algorithm.
import { validateFrontmatter, resolveSkillField } from '@graphorin/skills/frontmatter';

// Idempotent migrate-frontmatter helper used by the CLI.
import { migrateFrontmatter } from '@graphorin/skills/migration';

// Activation utilities (`/skill:<name>` parser).
import { parseSlashCommand, isSlashCommand } from '@graphorin/skills/activation';

// Spec-snapshot helpers.
import { getSpecSnapshot, getKnownField, compareAuthorSpecHint } from '@graphorin/skills/spec';

// Typed errors.
import { SkillFrontmatterConflictError, InputFilterRequiredError } from '@graphorin/skills/errors';
```

## Hello-world

```ts
import { loadSkillFromSource, createSkillRegistry } from '@graphorin/skills';

const skill = await loadSkillFromSource(
  { kind: 'folder', path: './skills/finance-helper' },
  { conflictPolicy: 'warn', runtimeVersion: '0.15.1' },
);

const registry = createSkillRegistry();
registry.register(skill);

const metadataBlock = registry.getAutoActivationMetadata();
// → metadata fed into the system prompt by the agent runtime (Phase 12).

const activation = registry.resolveTrigger('/skill:finance-helper run-quarterly-report');
if (activation !== null) {
  const body = await activation.skill.body();
  // → Tier-2 body resolved lazily on first call; cached afterwards.
}
```

## Frontmatter cheat sheet

```yaml
---
# === Public SKILL.md packaging format (no prefix) ===
name: finance-helper
description: |
  Surface monthly P&L reports. Use when the user asks about cash
  flow, runway, or quarterly business reports.
license: MIT
disable-model-invocation: false

# === Graphorin extensions (namespaced) ===
graphorin-runtime-compat: ^0.15.1
graphorin-trust-level: trusted
graphorin-sensitivity: internal
graphorin-handoff-input-filter: lastUser
graphorin-tools:
  - name: pull_quarterly_report
    description: Read the latest quarterly close.
    tags: ['finance', 'reporting']
graphorin-signature:
  algorithm: ed25519-sha256
  publisher: example.com
  publishedAt: 2026-04-19T12:00:00Z
  signature: <base64url>
  publicKeyRef:
    kind: well-known
    url: https://example.com/.well-known/graphorin-skill-pubkey.pem
---

# Finance Helper

The body of the SKILL.md is loaded lazily on activation.
```

## Trust levels

| Source         | Default `graphorin-trust-level`         | `--ignore-scripts`         | Signature                   |
|----------------|------------------------------------------|----------------------------|-----------------------------|
| `folder`       | `trusted` (override `trusted-with-scripts`) | default ON; opt-in override | optional                    |
| `npm-package`  | `untrusted` (override via `trustLevel`)  | mandatory (no override)     | mandatory                   |
| `git-repo`     | `untrusted`                              | mandatory                   | mandatory                   |
| `inline`       | `trusted` (test fixture)                 | n/a                         | n/a                         |

The supply-chain layer enforces `--ignore-scripts` and signature
verification through `@graphorin/security/supply-chain`. The skills
loader does not duplicate that logic - it delegates and surfaces the
resulting `ResolvedSkillTrustPolicy` alongside the loaded skill.

## Dependencies

- `yaml@^2.8.0` - required runtime dependency. Used for frontmatter
  parsing and migrator output.
- `@graphorin/core` - typed contracts (`ResolvedTool`, …) consumed by
  the registry's tool-declaration surface.
- `@graphorin/security` - supply-chain installer, ed25519 signature
  verifier, trust-policy resolver. Skills loaded from `npm-package`
  and `git-repo` sources go through this package.
- `@graphorin/tools` - peer surface the agent runtime uses to
  register skill-bundled tools after activation. The skills loader
  does not import the runtime registry directly; it returns a typed
  `RegisteredToolDeclaration[]` the runtime consumes.

## License

MIT. Copyright © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.15.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
