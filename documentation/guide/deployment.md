---
title: Deployment
description: Run Graphorin in production - systemd, Docker, Kubernetes, GitHub Actions integration, file modes, and observability hookup.
---

# Deployment

Graphorin runs in two shapes:

- **Library mode** - embedded in your existing Node.js process. No deployment story beyond your own application's.
- **Daemon mode** - `@graphorin/server` running as a long-lived process. The rest of this page covers production deployment of the daemon.

## Reference templates

The repository ships templates for the four most common production environments:

- `examples/systemd/` - a hardened unit file for systemd-managed servers.
- `examples/docker/` - a multi-stage `Dockerfile` (see its README for the `docker run` flags).
- `examples/k8s/` - a `Deployment` + `Service` + `ConfigMap` manifest set.
- `examples/github-actions/` - a workflow that exercises Graphorin from CI.

All four templates run Graphorin as a **non-root** user with the audit log on its own mount and the secrets store unreadable by the application's main filesystem path.

## Production checklist

Before promoting a Graphorin deployment to production:

1. **Storage**
   - Pick a backend (local SQLite, encrypted SQLite, or a custom adapter).
   - Schedule a snapshot / replication job around `graphorin storage backup <dest>` - an online, consistent page-level copy that is safe under a live writer and preserves rowids. **Never use `VACUUM` or `VACUUM INTO` for backups**: rowid renumbering corrupts the FTS5 external-content mappings on restore.
   - Run `graphorin storage cleanup-backups` periodically to prune stale encryption backups on long-lived deployments.
   - Run `graphorin storage compact` after large prunes to return freed pages to the OS (rowid-safe batched `incremental_vacuum`; databases created before incremental auto-vacuum keep their high-water-mark size and the command says so honestly).
   - Backups are point-in-time copies: a later erasure (session delete, fact purge) does NOT propagate into backups already taken. Keep backup retention no longer than your erasure obligations and repeat the erasure after any restore - see [Erasure and retention](/guide/privacy#erasure-and-retention).
   - Review the retention policy (see [Retention and database growth](#retention-and-database-growth) below). Long-term growth is dominated by side tables, not primary content.

2. **Encryption-at-rest**
   - The audit log is **always** encrypted (mandatory).
   - Enable database encryption-at-rest via `@graphorin/store-sqlite-encrypted` for any deployment that stores user secrets or `secret`-tagged memory rows.
   - The passphrase resolves through `SecretRef` - keep it in the OS keychain or a managed vault, never in plain config files.

3. **Tokens**
   - Issue tokens with `graphorin token create --scopes <list> --expires-in <duration>`.
   - Set an expiry appropriate for the scopes. Admin (`admin:*`) tokens should be short-lived.
   - Rotate the deployment-wide pepper on a schedule.
   - Document who holds which token in your incident-response runbook.

4. **Observability**
   - Wire the OTLP-HTTP exporter to your collector URL (the [observability guide's](/guide/observability) example reads it from an `OTLP_URL` environment variable your app owns) or another supported exporter. The default is **no remote export**.
   - Confirm `withValidation(...)` is in the exporter chain - the tracer factory throws if it is missing, so this is a soft check.
   - Configure the redaction allowlist for any high-cardinality attribute that's safe to ship un-redacted.

5. **Triggers**
   - Decide which triggers run in production and at what cadence.
   - Use `graphorin triggers list` to review the active configuration.
   - Configure quotas if you operate against a paid LLM provider.

6. **OAuth**
   - Pre-register every authorisation server's client metadata.
   - Pin the redirect URI to a known loopback port for unattended hosts (no GUI), or to your reverse proxy on hosts with one.
   - Audit `graphorin auth status` periodically.

7. **Hardening**
   - Run `graphorin doctor --config <path>` after every deployment so the check covers the deployed config's storage and audit paths (without the flag it checks the default `~/.graphorin` layout). Fix every error before traffic is enabled.
   - Run as a dedicated service account.
   - Confine the secrets store to mode `0600`.
   - Confine the audit log to mode `0600`.
   - Confine the database to mode `0600` (what `graphorin doctor` expects).
   - Disable core dumps for the service account.

### Retention and database growth

The standalone server runs a unified retention sweep (`config.retention`, default every 6 hours, first sweep immediately at startup). Derived or recoverable data is pruned by default with conservative windows; primary user content is only pruned when you set an explicit `*Days` window. `retention.enabled: false` turns the whole mechanism off.

Growth surfaces:

| Surface (table)                          | What accumulates                         | Prune primitive                              | `config.retention` key            | Default    |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------- | --------------------------------- | ---------- |
| `spans`                                  | Persisted trace spans (telemetry)        | `pruneSpans`                                 | `spansDays`                       | 30 days    |
| `consolidator_runs`                      | Consolidator run counters                | `SqliteMemoryStore.consolidator.pruneRuns`   | `consolidatorRunsDays`            | 90 days    |
| `consolidator_failed_batches`            | Exhausted DLQ batches                    | `consolidator.pruneExhaustedBatches`         | `dlqExhaustedDays`                | 30 days    |
| `idempotency_records`                    | Cached keyed-POST response bodies        | `store.idempotency.prune`                    | `idempotency`                     | on (expired only) |
| `sessions` (+ cascade)                   | Sessions, handoffs, linked checkpoints   | `store.sessions.pruneSessions`               | `sessionsDays` (+ `sessionsClosedOnly`) | opt-in |
| `session_audit`                          | Session audit trail                      | `store.sessions.pruneAuditEntries`           | `auditDays`                       | opt-in     |
| `memory_history`                         | Fact supersede / change history          | `store.memory.pruneHistory`                  | `memoryHistoryDays`               | opt-in     |
| `workflow_checkpoints` + `workflow_pending_writes` | Terminal workflow threads      | `store.checkpoints.pruneThreads`             | `workflowThreadsDays` (always terminal-only) | opt-in |
| Replay JSONL directory (filesystem)      | Replay trace files                       | `pruneTraces` from `@graphorin/observability` | not covered - schedule via cron  | manual     |

The replay-JSONL directory is a **filesystem** surface, not a SQLite one: the server sweep deliberately does not touch it. Schedule `pruneTraces` (honouring its `retentionDays`) from cron or a maintenance job.

**Lib-mode (embedders, no server):** nothing sweeps automatically. Schedule the CLI prune commands (`graphorin audit prune`, `graphorin traces prune`) and/or call the store prune APIs from your own scheduler; the same table above tells you which primitive owns each surface.

Note: pruning marks pages free inside the database file; it does not shrink the file on disk by itself. Run `graphorin storage compact` (rowid-safe `incremental_vacuum`) to return the pages to the OS - see the [storage guide](/guide/storage) for why `VACUUM` stays forbidden and why databases created before incremental auto-vacuum keep their high-water-mark size.

## Systemd

```ini
# /etc/systemd/system/graphorin.service
[Unit]
Description=Graphorin standalone server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=graphorin
Group=graphorin
WorkingDirectory=/var/lib/graphorin
# The config loader reads .ts / .js / .mjs / .json files (not TOML).
ExecStart=/usr/bin/graphorin start --config /etc/graphorin/graphorin.config.mjs
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/graphorin
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
RestrictNamespaces=true
LockPersonality=true
# MemoryDenyWriteExecute=true  # DISABLED: incompatible with the V8 JIT (Node
#   crashes on start). Enable only with `node --jitless`.
RestrictRealtime=true
RestrictSUIDSGID=true
SystemCallArchitectures=native
CapabilityBoundingSet=

[Install]
WantedBy=multi-user.target
```

## Docker

The `examples/docker/` template ships a multi-stage build that produces a slim image with only the runtime dependencies. A prebuilt registry image is **not published yet** (see the root README), so build it locally from the template, then run:

```bash
docker build -t graphorin:0.9.0 -f examples/docker/Dockerfile .
docker run -d --name graphorin \
  --read-only --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cap-drop=ALL \
  -v graphorin-data:/data \
  -v "$PWD/config.json:/etc/graphorin/config.json:ro" \
  -v /run/secrets/graphorin:/run/secrets/graphorin:ro \
  -p 8080:8080 \
  graphorin:0.9.0
```

The image stores its state under `/data` and listens on `8080`; mount the data directory as a named volume so SQLite + the audit log + the secrets store survive container recreation, and mount a `config.json` (the server only reads `--config`) plus the `file:`-referenced secrets under `/run/secrets/graphorin`.

## Kubernetes

The `examples/k8s/` manifest set runs Graphorin as a non-root pod with:

- a single-replica `Deployment` (SQLite is single-writer) with a hardened security context;
- a `Service` for cluster-internal access;
- a `ConfigMap` for the server configuration.

Two objects are prerequisites you create out-of-band (the manifest's header comment spells them out): the `graphorin-secrets` `Secret` (deployment pepper + provider keys) and the `graphorin-data` `PersistentVolumeClaim`.

## GitHub Actions

The `examples/github-actions/` folder ships CI/CD workflow **templates** for a downstream app that embeds Graphorin: a Changesets-based release pipeline (`release.yml`), a security job with dependency audit + Sigstore verification (`security.yml`), and a `renovate.json`. They are starting points to copy into your own repository, not runnable example apps.

## Health checks

Wire your load balancer / orchestrator's liveness probe to `GET /v1/health`. The endpoint aggregates the storage, embedder, secrets, encryption, consolidator, triggers, and replay-buffer probes; it answers `200` while the rollup is `ok` or `degraded` and short-circuits to `503` only when a subsystem is `failing`, so probes do not flap on minor degradations.

## Next steps

- [Standalone server](/guide/standalone-server) - REST endpoints, configuration.
- [CLI](/guide/cli) - `graphorin doctor`, `graphorin token`.
- [Security](/guide/security) - production hardening checklist.
- [Observability](/guide/observability) - OTLP exporter wiring.

