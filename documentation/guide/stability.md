# Stability & versioning

What "stable" means for the `@graphorin/*` packages, what may change
between releases, which platforms are supported, and which on-disk /
wire artifacts carry compatibility guarantees. This page is the
contract; [Migration (pre-1.0)](/guide/migration) is the changelog-side
record of every change that exercised it.

## Versioning model

- **Lockstep releases.** Every published `@graphorin/*` package shares
  one version number and releases together. Mixing versions across
  packages is unsupported; upgrade the whole set at once.
- **Pre-1.0 semver.** On the `0.x` line, a **minor** bump
  (`0.13 -> 0.14`) may contain breaking changes, always with a
  dedicated section in [Migration](/guide/migration) and the root
  `CHANGELOG.md`. A **patch** bump contains fixes only - never a
  breaking change, never a removal.
- **After 1.0** the packages follow full semver: breaking changes only
  in majors.

## API stability tiers

Every exported symbol carries one of two TSDoc tags, rendered in the
[API reference](https://docs.graphorin.com/api/):

| Tag | Promise |
|---|---|
| `@stable` | Covered by the semver rules above: shape and behavior change only in a minor (pre-1.0) or major (post-1.0), with a migration note. |
| `@experimental` | May change or disappear **between minors** without the full deprecation ritual; a CHANGELOG note accompanies every removal. |

The whole `@graphorin/core` contract surface is `@stable` and is
guarded mechanically: `etc/core.api.md` is an API-extractor report
diffed in CI on every PR (`check-api-report`), so an accidental
signature change fails before review. `@experimental` appears today in
parts of `mcp`, `tools`, `security` and `skills`.

Two further surfaces are contractual even though they are strings, not
types:

- **Error codes and kinds** - the discriminators documented in the
  [error contract](/guide/errors) are API. Renaming one is a breaking
  change; message text is not contractual.
- **CLI command names, flags and exit codes** - the
  [CLI reference](/guide/cli) is diffed against the real commander
  tree in CI (`check-cli-docs`), and exit codes (`0` ok, `1`
  recoverable failure, `2` unsupported) are stable.

## Deprecation policy

When a stable API is replaced rather than fixed:

1. The release that introduces the replacement keeps the old surface
   as a **deprecated alias** (TSDoc `@deprecated` pointing at the
   successor).
2. The deprecation is announced in `CHANGELOG.md` and the
   [Migration](/guide/migration) notes for that version.
3. The alias survives **at least the next two minors** before removal
   (pre-1.0), and removals never land in a patch. Longer windows apply
   where an ecosystem depends on the surface (the MCP
   Sampling/Roots/Logging deprecation carries a 12-month window).

Existing precedents that followed this ritual:
`SecretValue.unwrap()` (alias of `reveal()`),
`SessionMemory.flushImportant` and the MCP SSE transport.

## Supported platforms

| Surface | Supported |
|---|---|
| Node.js | `>=22.12.0` (declared in every package's `engines`; CI runs Node 22) |
| Package managers | npm, pnpm and Yarn PnP consumers - all three exercised by the weekly published-consumer smoke |
| Module systems | CommonJS and ESM (dual builds, `arethetypeswrong` checked) |
| SQLite drivers | `better-sqlite3` `^12.9.0 \|\| ^13.0.0` and (encrypted store) `better-sqlite3-multiple-ciphers` `^12.9.0`, installed from prebuilt binaries |
| Container base | `node:22-slim` (`examples/docker/Dockerfile`, built + vulnerability-gated weekly for `linux/amd64`; `linux/arm64` best-effort) |
| External CLIs | 1Password CLI v2 (`op`) and Ollama - both exercised by pinned versions in the weekly real-integration workflow |

Security-fix support follows the published
[security policy](/contributing/security): on the `0.x` line the
latest minor receives fixes; after 1.0, the latest two minor lines.

## Artifact compatibility

The framework persists several artifact families. Their guarantees
differ, deliberately:

| Artifact | Format | Guarantee |
|---|---|---|
| Session exports | `graphorin-session-export` JSONL, schema `1.0` | Readers accept the current major and **two majors back**; a newer-major file fails fast with `SchemaTooNewError`. `graphorin migrate-export` re-writes old files to the current schema. |
| Store schema (SQLite) | Versioned migrations (`schema_migrations` table) | **Forward-only.** Migrations apply atomically and idempotently on `init()`, each checksummed - a tampered applied migration refuses to run. There is no downgrade path: rolling back a version means restoring the pre-upgrade backup (see [Operations runbooks](/guide/operations)). |
| Audit log | Dedicated always-encrypted SQLite chain | Verified by `graphorin audit verify`; exportable as JSONL (`audit export`) for archival. |
| Server wire protocol | REST + WebSocket JSON-RPC | Error envelope and JSON-RPC error codes are stable (see [error contract](/guide/errors#server-wire-formats)); new codes may be added in minors. |
| Config files | JSON/JS/MJS server config | Validated with precise issues on boot; `graphorin migrate-config` rewrites old configs across breaking config changes. |

## Road to 1.0

1.0 is a promise gate, not a feature gate. The remaining criteria, kept
honest here rather than implied:

- Load/soak evidence and a documented HA / scale-out story (today the
  standalone server is single-node; see
  [Operations runbooks](/guide/operations) for what IS covered).
- Verified upgrade / rollback / backup / restore drills in CI - the
  backup/restore drill already runs weekly in the Docker smoke
  workflow.
- A reproducible quality baseline for at least one cloud and one local
  provider path in the benchmark suite.
- Freezing this page's tier assignments: everything `@stable` at 1.0
  carries full semver from then on.
