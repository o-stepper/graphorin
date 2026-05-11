---
title: CLI
description: graphorin — the operator CLI for the standalone server. Doctor, secrets, storage, audit, memory, consolidator, triggers, auth, pricing, skills, traces.
---

# CLI

`@graphorin/cli` ships the operator CLI for the standalone server and a number of utility commands that work without the server (e.g. `graphorin doctor`, `graphorin migrate-export`). It is built on [`commander`](https://github.com/tj/commander.js) (MIT).

```bash
pnpm dlx @graphorin/cli --help
```

## Top-level commands

```text
graphorin start                 — start the standalone server
graphorin init                  — initialise a fresh data directory
graphorin migrate               — run pending storage migrations
graphorin migrate-config <path> — migrate an older graphorin.config.* file

graphorin doctor                — audit POSIX modes + sanity checks
graphorin token <subcommand>    — create / list / revoke server tokens
graphorin secrets <subcommand>  — list / get / set / delete / ref / rotate
graphorin storage <subcommand>  — vacuum / size / migrate
graphorin audit <subcommand>    — list / verify / export
graphorin memory <subcommand>   — list / search / forget / migrate-embedder
graphorin consolidator <subcommand> — run / status / clear-pending
graphorin triggers <subcommand> — list / fire / pause / resume
graphorin auth <subcommand>     — login / logout / status (OAuth flows)
graphorin pricing <subcommand>  — show / refresh / diff / missing
graphorin skills <subcommand>   — install / inspect / audit / migrate-frontmatter
graphorin traces <subcommand>   — list / show
graphorin migrate-export <path> — export a JSONL session from the local DB
graphorin guard <subcommand>    — preview / explain memory-modification policies
graphorin telemetry <subcommand> — show effective tracing configuration
graphorin tools-lint <path>     — lint workspace tools against the @graphorin/eslint-plugin rules
```

## `graphorin start`

```bash
graphorin start --config ./graphorin.config.toml
graphorin start --port 8787 --storage ./assistant.db
```

Boots the standalone server. Honours every config field listed in [Standalone server § Configuration](/guide/standalone-server#configuration). The process emits a single startup line with the resolved configuration (with secrets redacted).

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
graphorin token create --scope agents:invoke --ttl 30d
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
graphorin pricing show
graphorin pricing refresh                     # fetches a fresh snapshot on demand
graphorin pricing diff
```

The bundled snapshot is **never refreshed automatically** — only an explicit invocation of `graphorin pricing refresh` reaches the network. See [Pricing](/reference/pricing).

## `graphorin skills`

```bash
graphorin skills install --source npm-package --name @org/skill --signature-policy required
graphorin skills inspect <path-or-package>
graphorin skills audit                       # checks signatures + sandbox tier
graphorin skills migrate-frontmatter <path>  # idempotent dry-run by default
```

## `graphorin auth`

```bash
graphorin auth login mcp.example.com
graphorin auth logout mcp.example.com
graphorin auth status
```

OAuth 2.1 with PKCE. The redirect happens on a loopback address bound to a free port; tokens land in the configured secrets store. See [Security § OAuth 2.1 with PKCE](/guide/security#oauth-2-1-with-pkce).

## `graphorin memory`

```bash
graphorin memory list --tier semantic --user-id alex
graphorin memory search 'mountain hike' --tier semantic --user-id alex
graphorin memory forget <fact-id>
graphorin memory migrate-embedder --target Xenova/multilingual-e5-large --strategy auto-migrate
```

## `graphorin consolidator`

```bash
graphorin consolidator status
graphorin consolidator run --phase light
graphorin consolidator clear-pending --older-than 30d
```

## `graphorin migrate-export`

```bash
graphorin migrate-export ./session.jsonl --session-id s1 --schema-version 1.0
```

Produces a deterministic JSONL export — see [Sessions § JSONL export schema 1.0](/guide/sessions#jsonl-export-schema-1-0).

## `graphorin telemetry`

```bash
graphorin telemetry show
```

Prints the effective tracing configuration: exporters, redaction patterns, sensitivity allowlists, and the resolved `gen_ai.system` mappings. Honours the same `withValidation(...)` requirement as runtime — there is no way to disable redaction from the CLI.

## Privacy

The CLI never phones home. The only outbound calls happen on commands that explicitly initiate a network operation (`graphorin pricing refresh`, `graphorin auth login`, `graphorin skills install --source npm-package`). Each one is documented in `--help` and audited.

## Next steps

- [Standalone server](/guide/standalone-server) — what `graphorin start` boots.
- [Security](/guide/security) — `graphorin doctor`, `graphorin token`, `graphorin auth`.
- [Privacy](/guide/privacy) — the no-phone-home contract.

---

**Graphorin** · v0.1.0 · MIT License · © 2026 Oleksiy Stepurenko
