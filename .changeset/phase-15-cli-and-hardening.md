---
'@graphorin/cli': minor
'@graphorin/eslint-plugin': minor
'@graphorin/server': minor
---

Phase 15 — CLI extensions, process hardening, distribution templates, and the RB-49 tool-description quality rules.

`@graphorin/cli` extends the binary that landed in Phase 14a with sixteen new subcommand groups grouped by purpose:

- **Diagnostics:** `graphorin doctor` (POSIX file modes + secrets store + audit-encryption + systemd hardening; `--fix-perms` repairs drifted modes); `graphorin telemetry status / enable / disable / inspect` (informational stubs reporting the framework's zero-default policy per DEC-154 / ADR-041); `graphorin traces status / prune --before <date>`; `graphorin guard status / explain <toolName>` (memory-modification guard tier classifier per DEC-153).
- **Auth:** `graphorin token create / list / revoke / rotate / rekey / verify` (HMAC + pepper auth from ADR-027; raw token bytes are surfaced via `SecretValue.use(fn)` so they never live as a plain string); `graphorin secrets list / get / set / delete / ref / rotate` (honours `--secrets-source <kind>` + `--strict-secrets` per DEC-136); `graphorin auth login / list / refresh / revoke / status` (outbound OAuth subsystem from ADR-033).
- **Storage:** `graphorin storage status / encrypt / rekey / cleanup-backups` (`encrypt` and `rekey` exit `2` with a clear pointer to the Phase 16 `@graphorin/store-sqlite-encrypted` sub-pack when the cipher peer is missing); `graphorin audit verify / prune / export` (encrypted hash chain per DEC-124; opens `audit.db` through the framework default binding registered by `@graphorin/server`); `graphorin memory status / migrate`; `graphorin consolidator status / set-tier / stop` (persists the tier hint + pause flag into a lightweight `consolidator_admin` table the running daemon polls); `graphorin triggers list / status / fire / disable / prune`; `graphorin migrate-export <input> --to <file>` (round-trips a `graphorin-session-export/N.N` JSONL file through the writer per DEC-155 / ADR-042).
- **Catalogue:** `graphorin pricing status / refresh / diff / lookup / missing` (bundled snapshot per DEC-151; opt-in network refresh honours `GRAPHORIN_OFFLINE=1`); `graphorin skills install / inspect / audit / migrate-frontmatter` (supply-chain installer per DEC-140 / ADR-034 + ADR-043 frontmatter migration); `graphorin tools lint [--threshold <n>] [--format <text|json>] [--source <pattern>]` (RB-49: static AST analysis of every `tool({...})` registration with a per-tool grader rubric — 40 points for description quality, 30 points for examples coverage, 30 points for parameter-naming clarity, threshold-gated CI exit code).
- **Bootstrap:** `graphorin migrate-config <input>` (config-schema migration helper).

Every subcommand accepts `--json` so CI pipelines consume structured output without parsing the human report.

Process-hardening helpers (`refuse-to-run-as-root`, `process.umask(0o077)`, POSIX `0600`/`0700` verification per DEC-135) now run automatically before `graphorin start` and `graphorin migrate`.

`@graphorin/eslint-plugin` ships the three RB-49 rules — `tool-description-required`, `tool-examples-recommended`, `tool-parameter-naming` — that catch ambiguous tool descriptions / missing examples / generic parameter names at lint time. The shared discovery + grader module (`discoverToolCallsInSource`, `runToolRules`, `gradeTool`) is exported so `graphorin tools lint` re-uses the same logic — single source of truth across the lint surface and the CLI.

`@graphorin/server` exports `ensureStoreAuditBinding()` so the CLI can open `audit.db` through the framework default cipher binding without booting the HTTP listener.

Distribution templates ship under `examples/`:

- `examples/systemd/graphorin.service` — hardened systemd unit (`User=graphorin`, `UMask=0077`, `ProtectSystem=strict`, `NoNewPrivileges=true`, `CapabilityBoundingSet=`, `RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX`, `MemoryDenyWriteExecute=true`, `LimitCORE=0`).
- `examples/docker/Dockerfile` — multi-stage `node:22-slim` image with a non-root user (UID 10001) and a `HEALTHCHECK` against `/v1/health`.
- `examples/k8s/deployment.yaml` — Pod-Security-Standards "restricted" profile (`runAsNonRoot`, `seccompProfile: RuntimeDefault`, `readOnlyRootFilesystem`, projected secret mounts).
- `examples/github-actions/{security.yml,release.yml,renovate.json,audit-ignore.json}` — Sigstore-provenance + supply-chain workflows.

Honours the framework's no-phone-home promise (DEC-154 / ADR-041) end-to-end — the `pricing refresh`, `auth login / refresh`, and `skills install` subcommands short-circuit with an explanatory message when `GRAPHORIN_OFFLINE=1` is set.
