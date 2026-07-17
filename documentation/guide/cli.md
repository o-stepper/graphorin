---
title: CLI
description: graphorin - the operator CLI for the standalone server. Doctor, secrets, storage, audit, memory, consolidator, triggers, auth, pricing, skills, traces.
---

# CLI

`@graphorin/cli` ships the operator CLI for the standalone server and a number of utility commands that work without the server (e.g. `graphorin doctor`, `graphorin migrate-export`). It is built on [`commander`](https://github.com/tj/commander.js) (MIT).

Most commands operate directly on the same SQLite file a live server may hold open. Which commands are safe, which contend for the write lock, and which require stopping the server first is summarised in the [concurrency matrix](/guide/storage#concurrency-matrix). The short version: a concurrent CLI **write** can freeze the server's entire event loop for up to `busy_timeout` (default 5 s) per contended statement - health responses included - so schedule write-side maintenance accordingly.

```bash
pnpm dlx @graphorin/cli --help
```

## Top-level commands

```text
graphorin start                 - start the standalone server
graphorin init                  - initialise a fresh data directory
graphorin migrate               - run pending storage migrations
graphorin migrate-config <path> - migrate an older graphorin.config.* file

graphorin doctor                - audit POSIX modes + sanity checks
graphorin token <subcommand>    - create / list / revoke / rotate / rekey / verify
graphorin secrets <subcommand>  - list / get / set / delete / ref / rotate
graphorin storage <subcommand>  - status / encrypt / rekey / backup / cleanup-backups / compact
graphorin audit <subcommand>    - verify / prune / export
graphorin memory <subcommand>   - status / inspect / activity / why / review / prune-history / migrate
graphorin consolidator <subcommand> - status / set-tier / stop
graphorin triggers <subcommand> - list / status / fire / disable / prune
graphorin workflow <subcommand> - inspect / checkpoints (durable thread state)
graphorin auth <subcommand>     - login / list / refresh / revoke / status (OAuth flows)
graphorin pricing <subcommand>  - status / refresh / diff / lookup / missing
graphorin skills <subcommand>   - install / inspect / audit / migrate-frontmatter
graphorin traces <subcommand>   - status / prune
graphorin migrate-export <path> - migrate an existing JSONL session export file to the current schema
graphorin guard <subcommand>    - status / explain memory-modification policies
graphorin telemetry <subcommand> - status / enable / disable / inspect
graphorin tools lint            - lint workspace tools against the @graphorin/eslint-plugin rules
```

## `graphorin start`

```bash
graphorin start --config ./graphorin.config.mjs
graphorin start --host 127.0.0.1 --port 8787
```

Boots the standalone server. Honours every config field listed in [Standalone server § Configuration](/guide/standalone-server#configuration) (the config loader reads `.ts` / `.js` / `.mjs` / `.json` files, not TOML). At startup the process logs the resolved config file path and a single listening line (`@graphorin/server v<version> listening on http://<host>:<port><basePath>`); secret values are never printed.

## `graphorin init`

```bash
graphorin init                       # writes ./graphorin.config.ts + prints the pepper once
graphorin init --format json         # writes ./graphorin.config.json (defineConfig-free)
graphorin init --non-interactive --encrypted --out ./deploy/graphorin.config.json
```

Two config flavours (`--format ts|json`, default `ts`; a `.json` `--out` implies `json`):

- **`.ts`** uses `defineConfig` for editor type-checking, but loading it later requires a Node that can import TypeScript (23.6+/22.18+ native type stripping, or a registered loader such as `tsx`) **and** `@graphorin/server` resolvable from the config file's directory. Outside such a project tree the `.ts` config will not load.
- **`.json`** is plain data with the same content (the docker-template flavour) and loads anywhere with zero runtime requirements.

## `graphorin doctor`

Runs a sanity audit:

- POSIX file modes on the data directory, config, database, audit log, and secrets store (repairable with `--fix-perms`).
- The presence + readability of the configured secrets backend.
- The audit-log encryption binding (the SQLite cipher peer).
- Optional systemd unit validation (Linux).

A bare `graphorin doctor` runs the perms check only; opt in to the others with `--check-secrets` / `--check-encryption` / `--check-systemd`, or run everything with `--all`. Each check reports a status of `ok` / `warn` / `fail` / `skip` with an actionable remediation hint; any `fail` makes the command exit `1`. The doctor never writes to disk unless `--fix-perms` is supplied, and it opens no network connection unless `--smoke-local` is supplied (those legs talk to the local Ollama daemon only).

By default the perms check targets the `~/.graphorin` layout. Pass `--config <path>` to check a project deployment instead - the config file itself plus the storage and audit database paths it resolves to:

```bash
graphorin doctor --config ./graphorin.config.json
graphorin doctor --config ./graphorin.config.json --fix-perms
```

### `--smoke-local`: the local-first first-run smoke

`graphorin doctor --smoke-local` answers "will a local assistant actually run on this machine?" before you write any code. It exercises the same code paths the framework uses at runtime:

1. **`smoke:native`** - the native SQLite stack loads: the `better-sqlite3` binding plus the `sqlite-vec` extension. A pnpm-10 install that skipped the build scripts surfaces here as the actionable `SqliteNativeBindingError` fix (see [Native modules and pnpm 10](/guide/installation#native-modules-and-pnpm-10)) instead of a raw `bindings.js` stack at first use. A missing `sqlite-vec` degrades to `warn` (FTS recall still works).
2. **`smoke:sqlite-roundtrip`** - writes a fact to a throwaway store, closes it, reopens from disk and searches it back (FTS-only; no embedding model needed).
3. **`smoke:ollama`** - daemon reachability (`/api/version`). An unreachable daemon is a `warn`, not a `fail` - the storage legs above still count.
4. **`smoke:ollama-models`** - installed models; with `--ollama-model <name>` the named model must be present.
5. **`smoke:embedding`** - one real `/api/embed` call reporting the embedding dimension (default model `nomic-embed-text`; override with `--embed-model`).
6. **`smoke:chat`** - only with `--ollama-model`: a streamed tool-call round-trip through the real `ollamaAdapter` (`think: false`), reporting the server's load / prompt-eval / generation timings so a slow first answer is attributable to model load rather than generation.

```bash
graphorin doctor --smoke-local
graphorin doctor --smoke-local --ollama-model qwen3:8b-q4_K_M
graphorin doctor --smoke-local --ollama-base-url http://127.0.0.1:11434 --json
```

A healthy machine with a cold model looks like this - note the load-dominated chat timing:

```text
  [OK] smoke:native: better-sqlite3 binding + sqlite-vec extension loaded
  [OK] smoke:sqlite-roundtrip: write / reopen / search round-trip recalled the fact (FTS)
  [OK] smoke:ollama: daemon reachable at http://127.0.0.1:11434 (version 0.32.0)
  [OK] smoke:ollama-models: 'qwen3:8b-q4_K_M' is installed (5 model(s) total)
  [OK] smoke:embedding: 'nomic-embed-text' embeds (dimension 768)
  [OK] smoke:chat: streamed + tool call in 10521ms (load 9149ms, prompt 680ms, gen 679ms)
```

`--smoke-local` alone runs only the smoke; combine it with `--all` or any `--check-*` flag to add the host checks in the same report. It is deliberately not implied by `--all`, so CI hosts without an Ollama daemon can keep using `--all` unchanged.

## `graphorin token`

```bash
graphorin token create --scopes agents:invoke --expires-in 30d
graphorin token list
graphorin token revoke <token-id>
graphorin token rotate <token-id>       # revoke + reissue with the same scopes
graphorin token rekey                   # re-issue every active token (post-compromise)
graphorin token verify <token>          # offline checksum check - never consults the store
```

Tokens are HMAC-SHA256 over a deployment-wide pepper. The pepper is a `SecretRef` resolved at server boot. See [Security § Server-token authentication](/guide/security#server-token-authentication).

`token create` prints the raw token exactly once, on **stdout** (so `TOKEN=$(graphorin token create ...)` works); the log lines around it go to stderr.

`token rotate` revokes one token and reissues it with the same scopes; `token rekey` does that for **every** active token and is the post-compromise lever. Both accept `--env live|test` (default `live`). `token verify` is fully offline: it confirms the structural shape, the environment marker, and the CRC checksum without touching the store - a malformed token exits with code `1`. Verifying that a token is *active* (not revoked, not expired) still requires the server or `token list`.

**Revocation propagation**: `token revoke` / `token rotate` write the token STORE directly - they cannot reach a running server's in-memory verifier cache, so a live server may keep honoring the old token for up to the cache TTL (default 60s; the command prints this note). For immediate effect revoke through the live server (`DELETE /v1/tokens/<id>`, scope `tokens:revoke` - the REST path evicts the cache entry synchronously) or restart the daemon.

## `graphorin secrets`

```bash
graphorin secrets list
graphorin secrets get <key>
graphorin secrets get <key> --reveal           # audited reveal
graphorin secrets set <key> --from-stdin       # never accepts plaintext on argv
graphorin secrets set <key> --value <v>
graphorin secrets rotate <key> --new-value <v>
graphorin secrets delete <key>
graphorin secrets ref <uri>                    # test resolution of a SecretRef URI
```

Use `--secrets-source <auto|keyring|encrypted-file|env>` and `--strict-secrets` (per DEC-136) to control which `SecretsStore` flavour the CLI activates. The same flags are honoured by `graphorin start` so the running server uses the same store. See [Secrets](/guide/secrets).

## `graphorin pricing`

```bash
graphorin pricing status
graphorin pricing refresh --url <url>         # fetches a fresh snapshot on demand (network)
graphorin pricing diff --snapshot ./snapshot.json            # diff a supplied snapshot against the bundled one
graphorin pricing lookup --provider openai --model gpt-4o-2024-11-20    # resolve one (provider, model) entry
graphorin pricing missing --spans ./spans.json               # models with no pricing data
```

The bundled snapshot is **never refreshed automatically** - only an explicit invocation of `graphorin pricing refresh` reaches the network. Snapshot entries are keyed by the DATED model ids the upstream dataset publishes (`gpt-4o-2024-11-20`, not the `gpt-4o` alias) - an alias lookup reports "no pricing entry" with a WARN instead of resolving. See [Pricing](/reference/pricing).

## `graphorin skills`

```bash
graphorin skills install npm:@org/skill --version 1.2.0 --trust-level trusted
graphorin skills install git:https://github.com/org/skill --ref v1.2.0 --dry-run
graphorin skills inspect <path-or-package>
graphorin skills audit                       # checks signatures + sandbox tier
graphorin skills migrate-frontmatter --path <dir>  # dry-run by default: lists the files --apply would rewrite
```

::: warning The supply-chain registry is process-local in the current slice
`skills install` records its supply-chain entry in an in-memory registry that does not outlive the process, so a later `skills audit` / `skills inspect` invocation (a NEW process) does not see earlier installs - each command audits what it is pointed at, not an accumulated ledger. Treat the three subcommands as independent probes rather than a sequential install-then-audit workflow; a persistent registry is future work.
:::

## `graphorin auth`

```bash
graphorin auth login --server https://mcp.example.com
graphorin auth list                  # configured servers + whether a refresh token resolves
graphorin auth refresh <server-id>   # real across restarts - the refresh token persists in the secrets store (SPL-1)
graphorin auth revoke <server-id>    # RFC-7009 server-side revoke; the audit records 'error' when unconfirmed
graphorin auth status                # hasRefreshToken reflects what actually resolves
```

OAuth 2.1 with PKCE. The redirect happens on a loopback address bound to a free port; tokens land in the configured secrets store. See [Security § OAuth 2.1 with PKCE](/guide/security#oauth-2-1-with-pkce).

## `graphorin storage`

```bash
graphorin storage status
graphorin storage backup ./backups/data.db.bak      # online backup (page-level backup API)
graphorin storage cleanup-backups
graphorin storage compact
graphorin storage compact --batch-pages 200 --json
graphorin storage encrypt --passphrase-from file:./pass --swap
graphorin storage rekey --old-passphrase-from file:./old --new-passphrase-from file:./new
```

`backup`, `encrypt`, and `rekey` are documented in depth on their own pages rather than here: [Storage](/guide/storage) covers the backup API and the encryption lifecycle, [Persistence](/guide/persistence) the file layout, [Deployment](/guide/deployment) the operational recipes, and [Migration](/guide/migration) the schema side. In one line each: `storage backup` snapshots the live database through the SQLite online-backup API; `storage encrypt --swap` converts a plaintext database to an encrypted one and refuses while a live writer holds the file; `storage rekey` rewraps the encryption key and fails fast with `database is locked` if the server is still running. `encrypt` and `rekey` exit with code `2` unless the optional `@graphorin/store-sqlite-encrypted` sub-pack is installed.

`compact` (W-064) returns pruned pages to the OS: it runs `PRAGMA wal_checkpoint(TRUNCATE)` and then batched `PRAGMA incremental_vacuum` - the rowid-safe compaction path (unlike `VACUUM`, which is forbidden because it corrupts the FTS5 rowid mappings). It requires a database created with `auto_vacuum=2`; every database created from this version on qualifies, including encrypted ones. On an older database the command reports the high-water-mark limitation honestly and exits `0` without modifying the file - see [the storage guide](/guide/storage) for the recreation path. `--batch-pages <n>` bounds each vacuum bite (default 1000) so a huge freelist never holds the writer lock long.

## `graphorin audit`

```bash
graphorin audit verify                  # walk the hash chain, exit 1 on a break
graphorin audit export --to ./audit.jsonl
graphorin audit prune --before 2026-01-01
```

The audit trail's operator surface lives on the security-focused pages; this section exists so the command diff gate sees the full invocations. `audit verify` recomputes the append-only hash chain and exits `1` when any link fails; `audit export` writes the entries as JSONL for offline retention; `audit prune` deletes entries before a cutoff atomically and warns about re-anchoring when Merkle anchoring is enabled. Details: [Security](/guide/security), [Deployment](/guide/deployment), [Privacy](/guide/privacy).

## `graphorin memory`

Read-only operator inspection of the long-term memory store, the quarantine review surface, plus the explicit embedder swap. `inspect`, `activity`, `why`, and `review` query the store directly and never load an embedder.

```bash
graphorin memory status                  # counts + active embedder
graphorin memory inspect <fact-id>       # one fact: supersede chain, quarantine, conflicts, citing insights
graphorin memory activity --limit 20     # store-wide consolidator / reflection activity
graphorin memory why --session s1 --limit 5   # explain why facts were recalled (ranking signals) from persisted spans
graphorin memory review                  # list quarantined facts / episodes / insights / procedures
graphorin memory review --promote <id> --reason "reviewed"   # promote a reviewed item out of quarantine
graphorin memory prune-history --older-than 90d   # delete memory_history rows older than the threshold
graphorin memory migrate --from ollama:old@768 --to ollama:new@768 --strategy auto-migrate --embedders ./embedders.mjs   # resumable embedder swap
graphorin memory migrate --from ollama:old@768 --to ollama:new@768 --strategy auto-migrate --embedders ./embedders.mjs --batch-size 256 --reclaim --json   # + space reclaim
```

`status`, `inspect`, `activity`, `why`, `review`, `prune-history`, and `migrate` accept `--json` for a structured document. `memory prune-history` is the supported retention lever over `memory_history`: the table grows by design (every supersede / quarantine transition appends a row) and `purge()` already scrubs sensitive text from it, so pruning is storage-cost hygiene, not a privacy control. `--older-than` is mandatory (destructive by design, no default) and takes an age (`30d`, `12h`) or a past ISO date; the resolved value is an AGE, matching `MemoryStoreExt.pruneHistory(olderThanMs)`. `memory inspect`, `memory activity`, and `memory why` are the operator side of [recall explainability](/guide/memory-system#recall-explainability) - `why` decodes the per-fact ranking signals from the persisted recall spans (RP-17). `memory review` lists everything the consolidator left quarantined and promotes a reviewed item out of quarantine; promotion runs through the same injection gate the agent faces, so an injection-flagged memory is **refused** unless you pass `--force` from a trusted operator context after review.

`memory migrate` (wave-D D5) drives the resumable embedder swap: `--embedders` points at a local JS module exporting `{ embedders: { '<canonical-id>': () => EmbedderProvider } }` (the CLI never downloads models implicitly - DEC-154), `--strategy` is one of `lock-on-first` | `auto-migrate` | `multi-active`, and `--batch-size` bounds each re-embed batch (default 512). Progress is persisted into the `migration_state` table after every batch, so a killed or aborted migration RESUMES from its cursor on the next identical invocation - across process restarts. `--reclaim` additionally drops the retired embedder's vector sidecar tables after commit and runs `PRAGMA incremental_vacuum` (freed pages return on `auto_vacuum=INCREMENTAL` databases; older files keep their high-water size - see the [storage runbook](/guide/storage#embedder-migration-and-space-reclaim-runbook)). A long `auto-migrate` contends for the write lock; prefer quiet hours or a stopped server.

## `graphorin consolidator`

```bash
graphorin consolidator status
graphorin consolidator set-tier standard
graphorin consolidator stop
graphorin consolidator dlq-list                       # dead-letter batches, all users
graphorin consolidator dlq-clear                      # delete EXHAUSTED batches (default)
graphorin consolidator dlq-clear --before 2026-06-01  # ...older than a cutoff
```

`dlq-list` makes the `dead-letter queue: N` warning from `status` actionable: it shows every failed batch (id, user, phase, error kind, retry count, exhausted flag) across all users; narrow with `--user <id>`. `dlq-clear` deletes batches - by default only EXHAUSTED ones (retries used up, `next_retry_at` empty); batches still awaiting retry belong to the automatic retry loop and are only removed with an explicit `--exhausted-only=false`. `--id <id>` clears one batch. Clearing discards the batch payload (the unprocessed message ids) permanently.

> `consolidator set-tier` / `consolidator stop` exit with code `2` (UNSUPPORTED) - there is no runtime control channel into the daemon yet, and the CLI refuses to pretend otherwise (IP-4). To change the tier, edit `consolidator.tier` in the config and restart; to stop consolidation now, stop the server process. `triggers fire` likewise points at the working server route (`POST /v1/triggers/:id/fire`).

## `graphorin triggers`

```bash
graphorin triggers list                       # every persisted trigger
graphorin triggers status <id>                # single-trigger detail
graphorin triggers disable <id>               # flip the disabled column
graphorin triggers prune --before 2026-06-01  # drop disabled triggers older than the cutoff
graphorin triggers fire <id>                  # exit 2 - use the server route instead
```

Operates directly on the durable trigger registry in the store; all subcommands accept `--config` and `--json`. `status` exits `1` when the id does not exist. `prune` removes **disabled** rows only, and only those whose last activity (`lastFiredAt`, or `createdAt` when never fired) is older than the `--before` cutoff - always pass `--before`; without it no dated row qualifies. `triggers fire` is honest about not being wired: a daemon-side poll does not exist yet, so it exits with code `2` (UNSUPPORTED) and prints the working alternative - `POST /v1/triggers/:id/fire` (scope `triggers:fire`) on the running server.

## `graphorin workflow`

```bash
graphorin workflow inspect <threadId> --workflow <name>      # latest checkpoint: status, pauses, state keys
graphorin workflow checkpoints <threadId> --workflow <name>  # every persisted checkpoint of the thread
```

Read-only inspection of durable workflow threads straight from the checkpoint store (E2): the CLI has no node graph to rebuild a `Workflow` handle from, so `--workflow <name>` supplies the workflow NAME and the command derives the same `workflow/<name>` namespace `createWorkflow` uses. `inspect` prints the thread status, step number, checkpoint id, and the full pending-pause frontier - durable timers show their `wakeAt`, awakeables/approvals their `name` (an approval parked with a defer deadline shows both). Both subcommands accept `--config` and `--json` and exit `1` when the thread does not exist under that workflow. Neither command mutates anything - resume/approve/tick stay on the server routes (`POST /v1/workflows/:id/resume` and friends).

## `graphorin migrate-export`

```bash
graphorin migrate-export ./session.jsonl --to ./session.migrated.jsonl --to-schema 1.0 --json
```

Produces a deterministic JSONL export - see [Sessions § JSONL export schema 1.0](/guide/sessions#jsonl-export-schema-1-0).

## `graphorin telemetry`

```bash
graphorin telemetry status            # the phone-home policy: always "disabled (zero-default)"
graphorin telemetry inspect           # same policy document, structured (--json friendly)
graphorin telemetry enable            # refuses (exit 1) - zero phone-home is the contract
graphorin telemetry disable           # no-op - telemetry is always disabled
```

`status` and `inspect` report the **phone-home policy**, not your runtime tracing configuration: the framework has no built-in collector, so both print the fixed zero-default policy document (disabled, with the privacy reference). Your OpenTelemetry wiring - exporters, `withValidation(...)` redaction, sensitivity floors - lives in application code and is inspected there, not through this command group.

`enable` and `disable` encode the zero-default-telemetry promise (DEC-154 / ADR-041) as commands: `enable` **refuses** with exit code `1` and points at `SECURITY.md § Privacy & telemetry` (an opt-in collector is roadmap, not reality), and `disable` is a no-op that confirms the already-permanent state. They exist so an operator probing the surface gets the policy as an answer instead of silence.

## `graphorin traces`

```bash
graphorin traces status                         # span count + time range
graphorin traces prune --before 2026-06-01      # delete spans that FINISHED before the cutoff
```

Both operate on the `spans` table written by the SQLite span exporter (the same table that backs `session.replay()` and `graphorin memory why`). `status` reports the row count and the ISO time range of recorded span starts. `prune` deletes spans whose END time is strictly before `--before` (ISO date or epoch milliseconds; the ns conversion happens internally) - including spans not attached to any session, whose only deletion path is age. Session-scoped spans are also removed by the session hard-delete cascade. Put `traces prune` in cron to bound trace growth.

## `graphorin guard`

```bash
graphorin guard status                        # the five guard tiers + their variants
graphorin guard explain my-tool --tags web,write --trust-level user-defined
```

Inspection surface for the memory-modification guard (no store access, purely the classifier). `status` prints the five tiers (`pure`, `side-effecting-no-memory`, `memory-aware`, `unknown`, `untrusted`) and the variants each accepts. `explain <toolName>` derives the tier the classifier **would** assign to a tool with the supplied metadata - feed it `--tags`, `--secrets-allowed`, `--trust-level built-in|user-defined|trusted|untrusted`, or `--explicit-tier` to answer "why did my tool end up memory-aware?" before wiring it. Both accept `--json`.

## `graphorin tools lint`

```bash
graphorin tools lint                             # scan src/**/*.{ts,tsx} for tool({...}) registrations
graphorin tools lint --config ./tsconfig.json    # scan the tsconfig's include[0] glob instead
graphorin tools lint --source "src/skills/**/tools/*.ts" --threshold 80 --format json
```

Text-based static scan (no runtime probe, no `tsc`): discovers every `tool({...})` registration, runs the RB-49 rules from `@graphorin/eslint-plugin`, and grades each tool out of 100 (description 40 + examples 30 + parameter naming 30). Exit codes are CI-friendly: `0` when every tool meets `--threshold` (default `60`), `1` when at least one tool falls below it, and `2` when the invocation could not start - an unreadable or invalid `--config`, or one whose `include` carries no usable glob, refuses loudly instead of silently scanning nothing. Globs follow `minimatch` semantics: `**/` also matches zero directories, so `src/**/*.ts` sees files directly in `src/`.

## Privacy

The CLI never phones home. The only outbound calls happen on commands that explicitly initiate a network operation (`graphorin pricing refresh`, `graphorin auth login`, `graphorin auth refresh`, `graphorin auth revoke` - the RFC 7009 revocation POST, `graphorin skills install npm:<name>`). Each one is documented in `--help` and audited.

## Next steps

- [Standalone server](/guide/standalone-server) - what `graphorin start` boots.
- [Security](/guide/security) - `graphorin doctor`, `graphorin token`, `graphorin auth`.
- [Privacy](/guide/privacy) - the no-phone-home contract.

