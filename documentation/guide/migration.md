---
title: Migration (pre-1.0)
description: How Graphorin versions move before 1.0 — the versioning policy, storage migrations, and what to expect when upgrading.
---

# Migration (pre-1.0)

Graphorin is pre-1.0. This page tracks how versions move and what to expect
when upgrading.

## Versioning policy

- **Lockstep until 1.0.** Every `@graphorin/*` package shares one version and
  is released together. Install matching versions across the scope.
- **Pre-1.0 semantics.** Per semver, `0.x` minor bumps (`0.1 → 0.2`) may carry
  breaking changes. Patch bumps (`0.1.0 → 0.1.1`) are fixes only.
- **Breaking changes** are called out in the [changelog](/reference/changelog)
  and in the package `CHANGELOG.md` files, generated from changesets.

## Upgrading

```bash
# Upgrade the whole scope together (lockstep).
pnpm up "@graphorin/*@latest"
pnpm install
pnpm build && pnpm typecheck && pnpm test
```

After upgrading:

1. **Re-read the changelog** for the target version's breaking section.
2. **Rebuild** so producer `dist/*.d.ts` are current before downstream
   typecheck.
3. **Run your tests.** Strict TypeScript surfaces most contract changes at
   compile time.

## Data & schema migrations

- **SQLite store** migrations run automatically at startup inside a
  transaction. Take a backup and test on a staging copy before upgrading
  production. See [Storage backends](/guide/storage).
- **Embedder changes** are governed by the migration policy
  (`lock-on-first` / `multi-active` / `auto-migrate`) — see
  [Embedders](/guide/embedders#embedder-identity-migrations). Changing the
  embedder model is a data migration, not just a config change.
- **Durable run / workflow state** carries a schema version
  (`graphorin-run-state/1.x`). Forward-compatible fields are synthesized when
  reading older snapshots; a major schema bump is documented in the changelog.

## Wire & export formats

- The WebSocket protocol is versioned via the `graphorin.protocol.v1`
  subprotocol; a future `v2` will negotiate explicitly.
- Session JSONL export and tool-cassette formats are versioned (schema `1.0`)
  and read back compatibly within the documented support window.

## When in doubt

Pin exact versions, upgrade in a branch, and run the full gate
(`pnpm run mvp-readiness`) before promoting. Report regressions on the issue
tracker with the from/to versions.
