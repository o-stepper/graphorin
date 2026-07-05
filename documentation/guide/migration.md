---
title: Migration (pre-1.0)
description: How Graphorin versions move before 1.0 - the versioning policy, storage migrations, and what to expect when upgrading.
---

# Migration (pre-1.0)

Graphorin is pre-1.0. This page tracks how versions move and what to expect
when upgrading.

## Versioning policy

- **Lockstep until 1.0.** Every `@graphorin/*` package shares one version and
  is released together. Install matching versions across the scope.
- **Pre-1.0 semantics.** Per semver, `0.x` minor bumps (`0.1 → 0.2`) may carry
  breaking changes. Patch bumps (`0.1.0 → 0.1.1`) are fixes only.
- **Breaking changes** land in the root [changelog](/reference/changelog) as
  part of each version's thematic release notes (there is no dedicated
  "breaking" subsection today); the per-package `CHANGELOG.md` files point
  back to the root changelog for the full notes. The
  [version notes](#version-notes) below distil the upgrade-relevant changes
  per version.

## Upgrading

```bash
# Upgrade the whole scope together (lockstep).
pnpm up "@graphorin/*@latest"
pnpm install
pnpm build && pnpm typecheck && pnpm test
```

After upgrading:

1. **Re-read the changelog entry** for the target version, plus the matching
   [version notes](#version-notes) section below.
2. **Rebuild** so producer `dist/*.d.ts` are current before downstream
   typecheck.
3. **Run your tests.** Strict TypeScript surfaces most contract changes at
   compile time.

## Version notes

### Before any upgrade

- **Back up the SQLite file**: `graphorin storage backup <dest>` takes an
  online, consistent copy (safe under a live writer; an encrypted store
  produces an equally encrypted copy).
- **Read the root [changelog](/reference/changelog) entry** for the target
  version.
- **Bump every `@graphorin/*` package together** (lockstep):
  `pnpm up "@graphorin/*@latest"`. Mixed versions across the scope are not
  supported.

### 0.5.x -> 0.6.0

- **Durable HITL resume is exactly-once.** With a `checkpointStore` wired, an
  approved call's resume writes a write-ahead intent checkpoint before
  dispatch and the journaled post-dispatch state after it, so resuming from
  the latest state executes the tool exactly once. Re-check operator flows
  that re-resume stale pre-execution snapshots; those stay bounded at one
  re-execution per stale resume.
- **Tool parameters are real JSON Schema on the wire.** Plain Zod input
  schemas are now converted by a structural Zod v3/v4 converter
  (`@graphorin/tools/schema`) instead of leaking serialized validator
  internals to providers; unprojectable schemas degrade loudly (WARN plus a
  permissive `{}`).
- **Workflow durability changes.** The `'async'` durability source is
  removed. `CheckpointStore.put` gained an optional `{ expectedLatestId }`
  compare-and-set argument; both bundled stores honour it (a lost race
  throws `CheckpointConflictError`), and custom store implementations should
  adopt it. `WorkflowConfig.version` pins a workflow definition to its
  checkpoints (`workflow-version-mismatch` on divergence).
- **Store schema advances to migration 028** (fact-supersede indexes, the
  memory owner column, fact access counters, rules FTS). Migrations run
  automatically when the store opens; back up first.

### 0.4.0 -> 0.5.0

- **Approved-tool resume now fires side effects.** Resuming a granted HITL
  approval dispatches the approved call through the executor for real, so
  the side effect happens and its output reaches the model. Update HITL
  integrations that assumed resuming a grant was side-effect-free.
- **Structured tool outputs spill to handles by default.** Over-cap object
  outputs no longer bypass truncation; on the default strategy the full body
  is stored behind a result handle (re-fetchable via `read_result`) instead
  of being inlined whole. Raise a tool's `maxResultTokens` where the model
  must see more inline.
- **Store schema advances to migration 024.** Migrations run automatically
  inside a transaction when the store opens; back up before upgrading
  production.

### 0.3.0 -> 0.4.0

- **The memory program is additive.** Temporal `as_of` reads, provenance +
  quarantine, insights, the entity graph, iterative retrieval, and
  procedural induction are new, opt-in surfaces; existing call sites keep
  working.
- **Store schema advances through migrations 013-017** (provenance,
  insights, fact importance, entities, procedures); they run automatically
  on open.

## Data & schema migrations

- **SQLite store** migrations run automatically at startup inside a
  transaction. Take a backup and test on a staging copy before upgrading
  production. See [Storage backends](/guide/storage).
- **Embedder changes** are governed by the migration policy
  (`lock-on-first` / `multi-active` / `auto-migrate`) - see
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
