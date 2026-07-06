---
title: CLI
description: graphorin - the operator CLI for the standalone server. Doctor, secrets, storage, audit, memory, consolidator, triggers, auth, pricing, skills, traces.
---

# CLI

`@graphorin/cli` ships the operator CLI for the standalone server and a number of utility commands that work without the server (e.g. `graphorin doctor`, `graphorin migrate-export`). It is built on [`commander`](https://github.com/tj/commander.js) (MIT).

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

Boots the standalone server. Honours every config field listed in [Standalone server § Configuration](/guide/standalone-server#configuration) (the config loader reads `.ts` / `.js` / `.mjs` / `.json` files, not TOML). The process emits a single startup line with the resolved configuration (with secrets redacted).

## `graphorin doctor`

Runs a sanity audit:

- POSIX file modes on the database, audit log, secrets store.
- The `engines.node` requirement.
- The presence + readability of the configured secrets backend.
- Optional systemd unit template validation.
- Provider reachability (only on configured base URLs; never opens new outbound connections beyond the configured surface).

Failures are categorised by severity (`error`, `warning`, `info`) and emit actionable remediation steps.

## `graphorin token`

```bash
graphorin token create --scopes agents:invoke --expires-in 30d
graphorin token list
graphorin token revoke <token-id>
```

Tokens are HMAC-SHA256 over a deployment-wide pepper. The pepper is a `SecretRef` resolved at server boot. See [Security § Server-token authentication](/guide/security#server-token-authentication).

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
graphorin pricing lookup --provider openai --model gpt-4o    # resolve one (provider, model) entry
graphorin pricing missing --spans ./spans.json               # models with no pricing data
```

The bundled snapshot is **never refreshed automatically** - only an explicit invocation of `graphorin pricing refresh` reaches the network. See [Pricing](/reference/pricing).

## `graphorin skills`

```bash
graphorin skills install npm:@org/skill --version 1.2.0 --trust-level trusted
graphorin skills install git:https://github.com/org/skill --ref v1.2.0 --dry-run
graphorin skills inspect <path-or-package>
graphorin skills audit                       # checks signatures + sandbox tier
graphorin skills migrate-frontmatter <path>  # idempotent dry-run by default
```

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
graphorin storage cleanup-backups
graphorin storage compact
graphorin storage compact --batch-pages 200 --json
```

`compact` (W-064) returns pruned pages to the OS: it runs `PRAGMA wal_checkpoint(TRUNCATE)` and then batched `PRAGMA incremental_vacuum` - the rowid-safe compaction path (unlike `VACUUM`, which is forbidden because it corrupts the FTS5 rowid mappings). It requires a database created with `auto_vacuum=2`; every database created from this version on qualifies, including encrypted ones. On an older database the command reports the high-water-mark limitation honestly and exits `0` without modifying the file - see [the storage guide](/guide/storage) for the recreation path. `--batch-pages <n>` bounds each vacuum bite (default 1000) so a huge freelist never holds the writer lock long.

## `graphorin memory`

Read-only operator inspection of the long-term memory store, the quarantine review surface, plus the explicit embedder swap. `inspect`, `activity`, `why`, and `review` query the store directly and never load an embedder.

```bash
graphorin memory status                  # counts + active embedder + migration state
graphorin memory inspect <fact-id>       # one fact: supersede chain, quarantine, conflicts, citing insights
graphorin memory activity --limit 20     # store-wide consolidator / reflection activity
graphorin memory why --session s1 --limit 5   # explain why facts were recalled (ranking signals) from persisted spans
graphorin memory review                  # list quarantined facts / episodes / insights / procedures
graphorin memory review --promote <id> --reason "reviewed"   # promote a reviewed item out of quarantine
graphorin memory prune-history --older-than 90d   # delete memory_history rows older than the threshold
graphorin memory migrate --from <id> --to <id> --strategy auto-migrate --embedders ./embedders.mjs   # not yet supported (exit 2)
```

`status`, `inspect`, `activity`, `why`, `review`, and `prune-history` accept `--json` for a structured document. `memory prune-history` is the supported retention lever over `memory_history`: the table grows by design (every supersede / quarantine transition appends a row) and `purge()` already scrubs sensitive text from it, so pruning is storage-cost hygiene, not a privacy control. `--older-than` is mandatory (destructive by design, no default) and takes an age (`30d`, `12h`) or a past ISO date; the resolved value is an AGE, matching `MemoryStoreExt.pruneHistory(olderThanMs)`. `memory inspect`, `memory activity`, and `memory why` are the operator side of [recall explainability](/guide/memory-system#recall-explainability) - `why` decodes the per-fact ranking signals from the persisted recall spans (RP-17). `memory review` lists everything the consolidator left quarantined and promotes a reviewed item out of quarantine; promotion runs through the same injection gate the agent faces, so an injection-flagged memory is **refused** unless you pass `--force` from a trusted operator context after review. `migrate` is **not yet supported**: `--embedders` module resolution is planned, and today the command always exits with code `2` (UNSUPPORTED) after printing the programmatic pointer. Run an [embedder migration](/guide/memory-system#embedder-migration) programmatically via `migrateEmbedder()` from `@graphorin/memory` instead (`--strategy` is one of `lock-on-first` | `auto-migrate` | `multi-active`).

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

## `graphorin migrate-export`

```bash
graphorin migrate-export ./session.jsonl --to ./session.migrated.jsonl --to-schema 1.0 --json
```

Produces a deterministic JSONL export - see [Sessions § JSONL export schema 1.0](/guide/sessions#jsonl-export-schema-1-0).

## `graphorin telemetry`

```bash
graphorin telemetry status
graphorin telemetry inspect           # dump the resolved exporter + redaction config
```

`status` prints the effective tracing configuration: exporters, redaction patterns, sensitivity allowlists, and the resolved `gen_ai.system` mappings. Honours the same `withValidation(...)` requirement as runtime - there is no way to disable redaction from the CLI.

## `graphorin traces`

```bash
graphorin traces status                         # span count + time range
graphorin traces prune --before 2026-06-01      # delete spans that FINISHED before the cutoff
```

Both operate on the `spans` table written by the SQLite span exporter (the same table that backs `session.replay()` and `graphorin memory why`). `status` reports the row count and the ISO time range of recorded span starts. `prune` deletes spans whose END time is strictly before `--before` (ISO date or epoch milliseconds; the ns conversion happens internally) - including spans not attached to any session, whose only deletion path is age. Session-scoped spans are also removed by the session hard-delete cascade. Put `traces prune` in cron to bound trace growth.

## Privacy

The CLI never phones home. The only outbound calls happen on commands that explicitly initiate a network operation (`graphorin pricing refresh`, `graphorin auth login`, `graphorin skills install npm:<name>`). Each one is documented in `--help` and audited.

## Next steps

- [Standalone server](/guide/standalone-server) - what `graphorin start` boots.
- [Security](/guide/security) - `graphorin doctor`, `graphorin token`, `graphorin auth`.
- [Privacy](/guide/privacy) - the no-phone-home contract.

