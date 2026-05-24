[**Graphorin API reference v0.3.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/cli

# @graphorin/cli

> Operator CLI for the [Graphorin](https://github.com/o-stepper/graphorin) framework.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-43853d.svg)](https://nodejs.org)

- **Version:** v0.3.0
- **License:** [MIT](../../_media/LICENSE-1) (© 2026 Oleksiy Stepurenko)
- **Repository:** <https://github.com/o-stepper/graphorin/tree/main/packages/cli>
- **Issues:** <https://github.com/o-stepper/graphorin/issues>

## What ships in v0.1 (Phases 14a + 15)

`@graphorin/cli` ships a single global binary, `graphorin`. Commands are grouped by purpose:

### Lifecycle (Phase 14a)

| Command | Purpose |
|---|---|
| `graphorin init` | Generate a fresh `graphorin.config.ts` with documented defaults; mint a one-shot bootstrap admin token + a server pepper (printed to stderr exactly once); choose the cloud-upload sensitivity tier and the storage-encryption opt-in interactively or via flags. |
| `graphorin migrate` | Apply every pending storage migration against the configured SQLite store (idempotent). |
| `graphorin migrate-config <input>` | Migrate an old `graphorin.config` file to the current schema. |
| `graphorin start` | Boot the standalone server with lifecycle hooks + pre-bind validation + storage migrations + audit log + graceful SIGTERM drain. |

### Diagnostics (Phase 15)

| Command | Purpose |
|---|---|
| `graphorin doctor [--all] [--check-*] [--fix-perms]` | Read-only host health check (POSIX file modes + secrets store + audit-encryption + systemd hardening). `--fix-perms` repairs drifted modes. |
| `graphorin telemetry status / enable / disable / inspect` | Reports the framework's zero-default telemetry policy (DEC-154 / ADR-041). |
| `graphorin traces status / prune` | Inspect the local trace cache; `prune --before <date>` enforces TTL. |
| `graphorin guard status / explain <toolName>` | Inspect the memory-modification guard tier policy (DEC-153). |

### Auth (Phase 15)

| Command | Purpose |
|---|---|
| `graphorin token create / list / revoke / rotate / rekey / verify` | Manage server auth tokens (HMAC + pepper, ADR-027). |
| `graphorin secrets list / get / set / delete / ref / rotate` | Manage secrets in the active store. Honours `--secrets-source` + `--strict-secrets`. |
| `graphorin auth login / list / refresh / revoke / status` | Outbound OAuth subsystem (e.g. for MCP servers, ADR-033). |

### Storage (Phase 15)

| Command | Purpose |
|---|---|
| `graphorin storage status / encrypt / rekey / cleanup-backups` | Inspect + encrypt + re-key the SQLite store. `encrypt` and `rekey` require the `@graphorin/store-sqlite-encrypted` sub-pack from Phase 16. |
| `graphorin audit verify / prune / export` | Operate on the encrypted, hash-chained audit log (DEC-124). |
| `graphorin memory status / migrate` | Inspect counts + active embedder; `migrate` swaps embedders. |
| `graphorin consolidator status / set-tier / stop` | Inspect + steer the background memory consolidator (DEC-134 / ADR-038). |
| `graphorin triggers list / status / fire / disable / prune` | Operate on the durable trigger registry (DEC-150). |
| `graphorin migrate-export <input> --to <file>` | Migrate session-export JSONL between schema versions (DEC-155 / ADR-042). |

### Catalogue (Phase 15)

| Command | Purpose |
|---|---|
| `graphorin pricing status / refresh / diff / lookup / missing` | Operate on the bundled LLM pricing snapshot (DEC-151). |
| `graphorin skills install / inspect / audit / migrate-frontmatter` | Manage operator-managed skill packages (DEC-140 / ADR-034 + DEC-156 / ADR-043). |
| `graphorin tools lint [--threshold <n>] [--format <text\|json>]` | Static AST analysis of every `tool({...})` registration with a per-tool grader rubric (40 / 30 / 30 = 100 points). |

Every Phase 15 subcommand accepts `--json` so CI pipelines can consume structured output instead of parsing the human report.

## Install

```bash
pnpm add -g @graphorin/cli
```

The published binary is named `graphorin`.

> Other npm-registry-compatible package managers work identically: `npm install -g @graphorin/cli`, `yarn global add @graphorin/cli`, `bun add -g @graphorin/cli`.

## Quickstart

```bash
# 1. Generate a config + mint the bootstrap material in the current directory.
graphorin init --non-interactive --cloud-consent=public-and-internal

# 2. Apply storage migrations to the configured SQLite store.
graphorin migrate --config ./graphorin.config.ts

# 3. Boot the standalone server.
graphorin start --config ./graphorin.config.ts
```

`GRAPHORIN_OFFLINE=1` is honoured by every subcommand — the CLI never makes implicit network calls (verified by the repository-wide `pnpm run check-no-network` CI check).

## Programmatic usage

Every command is exposed as an importable async (or sync, when no I/O is involved) function so CI / IDE / test pipelines can invoke them without spawning a child process:

```ts
import {
  runDoctor,
  runInit,
  runMigrate,
  runPricingStatus,
  runStart,
  runTokenCreate,
  runToolsLint,
} from '@graphorin/cli';

await runInit({ nonInteractive: true, cloudConsent: 'public-only' });
await runMigrate({ config: './graphorin.config.ts' });

const report = await runDoctor({ all: true, json: true });
if (report.summary.fail > 0) process.exit(1);

const lint = await runToolsLint({ threshold: 60, format: 'json' });

await runStart({ config: './graphorin.config.ts', port: 8090 });
```

## Distribution templates

Phase 15 ships ready-to-copy templates for production deployments:

- `examples/systemd/graphorin.service` — hardened systemd unit (refuse-as-root, `UMask=0077`, `ProtectSystem=strict`, `NoNewPrivileges=true`).
- `examples/docker/Dockerfile` — multi-stage Node 22-slim image with a non-root user (UID 10001), read-only rootfs friendly, `--cap-drop=ALL` ready.
- `examples/k8s/deployment.yaml` — Pod-Security-Standards "restricted" profile with `runAsNonRoot`, `seccompProfile: RuntimeDefault`, projected secret mounts.
- `examples/github-actions/{security.yml,release.yml,renovate.json,audit-ignore.json}` — supply-chain workflows (`pnpm audit`, Sigstore provenance verification, Changesets-driven releases).

## Status

`@graphorin/cli` is part of the Graphorin framework's `v0.3.0` pre-release. Once published, the package follows the lockstep release cadence shared by every `@graphorin/*` package on the `0.x` line.

---

**Project Graphorin** · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/cli/README.md) | `@graphorin/cli` — operator CLI for the Graphorin framework. |
| [commands](/api/@graphorin/cli/commands/index.md) | Public command entry points. The CLI binary thin-wraps these helpers; tests + downstream automations consume them directly so they never spawn a child process to exercise the contract. |
