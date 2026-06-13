---
title: Deployment
description: Run Graphorin in production — systemd, Docker, Kubernetes, GitHub Actions integration, file modes, and observability hookup.
---

# Deployment

Graphorin runs in two shapes:

- **Library mode** — embedded in your existing Node.js process. No deployment story beyond your own application's.
- **Daemon mode** — `@graphorin/server` running as a long-lived process. The rest of this page covers production deployment of the daemon.

## Reference templates

The repository ships templates for the four most common production environments:

- `examples/systemd/` — a hardened unit file for systemd-managed servers.
- `examples/docker/` — a multi-stage `Dockerfile` (see its README for the `docker run` flags).
- `examples/k8s/` — a `Deployment` + `Service` + `ConfigMap` manifest set.
- `examples/github-actions/` — a workflow that exercises Graphorin from CI.

All four templates run Graphorin as a **non-root** user with the audit log on its own mount and the secrets store unreadable by the application's main filesystem path.

## Production checklist

Before promoting a Graphorin deployment to production:

1. **Storage**
   - Pick a backend (local SQLite, encrypted SQLite, or a custom adapter).
   - Schedule a snapshot / replication job. The default SQLite write-ahead log makes online backups via `BACKUP TO …` straightforward.
   - Run `graphorin storage vacuum` periodically on long-lived deployments.

2. **Encryption-at-rest**
   - The audit log is **always** encrypted (mandatory).
   - Enable database encryption-at-rest via `@graphorin/store-sqlite-encrypted` for any deployment that stores user secrets or `secret`-tagged memory rows.
   - The passphrase resolves through `SecretRef` — keep it in the OS keychain or a managed vault, never in plain config files.

3. **Tokens**
   - Issue tokens with `graphorin token issue --role <role> --ttl <duration>`.
   - Set a TTL appropriate for the role. Admin tokens should be short-lived.
   - Rotate the deployment-wide pepper on a schedule.
   - Document who holds which token in your incident-response runbook.

4. **Observability**
   - Wire `OTLP_URL` (or another supported exporter). The default is **no remote export**.
   - Confirm `withValidation(...)` is in the exporter chain — the tracer factory throws if it is missing, so this is a soft check.
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
   - Run `graphorin doctor` after every deployment. Fix every error before traffic is enabled.
   - Run as a dedicated service account.
   - Confine the secrets store to mode `0600`.
   - Confine the audit log to mode `0600`.
   - Confine the database to mode `0640`.
   - Disable core dumps for the service account.

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
ExecStart=/usr/bin/node /usr/lib/graphorin/cli/dist/cli.js start --config /etc/graphorin/graphorin.config.toml
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
docker build -t graphorin:0.4.0 -f examples/docker/Dockerfile .
docker run -d --name graphorin \
  -v graphorin-data:/var/lib/graphorin \
  -p 127.0.0.1:8787:8787 \
  -e OTLP_URL=https://otel.example.com/v1/traces \
  graphorin:0.4.0
```

Mount the data directory as a named volume so SQLite + the audit log + the secrets store survive container recreation.

## Kubernetes

The `examples/k8s/` manifest set runs Graphorin as a non-root pod with:

- a `PersistentVolumeClaim` for the data directory;
- a `Secret` for the deployment pepper;
- a `ConfigMap` for the rest of the configuration;
- a `NetworkPolicy` that pins egress to the configured provider, MCP, and OTLP endpoints only.

## GitHub Actions

The `examples/github-actions/` template exercises Graphorin from a CI pipeline — a hermetic `pnpm` install, a stub-provider agent run, a smoke test against the standalone server, and a JSONL session export.

## Health checks

Wire your load balancer / orchestrator's liveness probe to `GET /v1/health`. The endpoint returns a `200 OK` only when storage, the audit log, the secrets store, and the triggers daemon are all healthy.

## Next steps

- [Standalone server](/guide/standalone-server) — REST endpoints, configuration.
- [CLI](/guide/cli) — `graphorin doctor`, `graphorin token`.
- [Security](/guide/security) — production hardening checklist.
- [Observability](/guide/observability) — OTLP exporter wiring.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
