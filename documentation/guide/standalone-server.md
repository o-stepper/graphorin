---
title: Standalone server
description: Promote your assistant to a daemon with REST + WebSocket + SSE fallback, durable triggers, replay, Prometheus metrics, and health checks.
---

# Standalone server

`@graphorin/server` is the optional standalone runtime. Same library packages, different lifetime — promote your assistant to a daemon with a network API the moment it has to outlive a single Node.js process.

::: tip Library mode is the default
You only need the standalone server when:
- your assistant has to **survive process restart**, OR
- you expose it over the network (browser, Slack bot, mobile app), OR
- you want **durable triggers** (cron, interval, idle, event).

For a CLI script or a desktop app, embed the library packages directly. See [Architecture § Two ways to ship](/guide/architecture#two-ways-to-ship).
:::

## Capabilities

| Capability | Library mode | Standalone server |
|---|---|---|
| Agent runs | ✓ | ✓ |
| Memory + sessions | ✓ | ✓ |
| Workflows | ✓ | ✓ |
| Tools / Skills / MCP | ✓ | ✓ |
| Durable HITL across **process restart** | ✓ (with the right checkpoint store) | ✓ |
| Triggers (cron / interval / idle / event) | manual scheduling | ✓ daemon |
| REST + WebSocket + SSE | — | ✓ |
| Server-token authentication | — | ✓ |
| Prometheus metrics endpoint | — | ✓ |
| Health checks | — | ✓ |
| Replay endpoint | manual via SQLite | ✓ |

## REST surface

Built on [`hono`](https://github.com/honojs/hono) (MIT) and [`@hono/node-server`](https://github.com/honojs/node-server) (MIT). The default `basePath` is `/v1`. Every authenticated endpoint requires a bearer token signed with HMAC-SHA256 against the deployment-wide pepper. The unauthenticated `/v1/health` route is exempt.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/health` | Liveness + readiness summary (probes for storage, audit log, secrets, triggers, encryption). |
| `GET` | `/v1/health/secrets` | Authenticated drilldown of the active `SecretsStore`. |
| `GET` | `/v1/metrics` | Prometheus exposition (path configurable; auth optional). |
| `GET` | `/v1/agents` | List registered agents. |
| `GET` | `/v1/agents/:id` | Describe a single agent. |
| `POST` | `/v1/agents/:id/run` | Run an agent synchronously and return the final output. |
| `POST` | `/v1/agents/:id/stream` | **Starts the run** and returns `202` with `runId` + the WS subject (`agent:<id>/runs/<runId>/events`) the events are emitted on (IP-2). Subscribe over WebSocket; workflow runs use `workflow:<id>/runs/<runId>/events`. |
| `GET` | `/v1/runs/:runId/state` | Read the current `RunState`. |
| `POST` | `/v1/runs/:runId/abort` | Abort a run. |
| `POST` | `/v1/runs/:runId/resume` | Resume a paused run with a directive (Phase 14a stub today). |
| `POST` | `/v1/runs/:runId/replay` | Replay a recorded run from the audit / cassette artefacts. |
| `GET` | `/v1/sessions` | List sessions. |
| `POST` | `/v1/sessions` | Create a session. |
| `GET` | `/v1/sessions/:id` | Read a session. |
| `DELETE` | `/v1/sessions/:id` | Delete a session. |
| `GET` | `/v1/sessions/:id/messages` | List messages. |
| `GET` | `/v1/sessions/:id/handoffs` | List handoffs. |
| `POST` | `/v1/sessions/:id/export` | Stream a JSONL export. |
| `POST` | `/v1/sessions/:id/replay` | Replay a recorded session. |
| `POST` | `/v1/memory/search` | Hybrid search across the memory tiers. |
| `POST` | `/v1/memory/facts` | Persist a fact. |
| `DELETE` | `/v1/memory/facts/:id` | Soft-delete a fact. |
| `POST` | `/v1/memory/blocks` | Define / update a working block. |
| `DELETE` | `/v1/memory/blocks/:label` | Detach a working block. |
| `GET` | `/v1/skills` | List loaded skills. |
| `GET` | `/v1/skills/:name` | Describe a skill. |
| `POST` | `/v1/skills/install` | Install a skill from a configured source. |
| `GET` | `/v1/mcp/servers` | List configured MCP servers. |
| `POST` | `/v1/mcp/servers` | Register a new MCP server connection. |
| `DELETE` | `/v1/mcp/servers/:id` | Disconnect a server. |
| `GET` | `/v1/audit` | Tailable audit log. |
| `POST` | `/v1/audit/verify` | Walk + verify the SHA-256 hash chain. |
| `POST` | `/v1/audit/export` | Export the audit log. |
| `GET` | `/v1/tokens` | List server tokens. |
| `POST` | `/v1/tokens` | Issue a token. |
| `DELETE` | `/v1/tokens/:id` | Revoke a token. |
| `GET` | `/v1/triggers` | List configured triggers. |
| `POST` | `/v1/triggers/:id/fire` | Fire a trigger immediately. |
| `POST` | `/v1/triggers/:id/disable` | **Flag flip** — pause the trigger; it stays registered and persisted. |
| `POST` | `/v1/triggers/:id/enable` | Re-enable a paused trigger (the next fire is recomputed from now). |
| `DELETE` | `/v1/triggers/:id` | **Destructive** — unregister and remove the trigger. |
| `GET` | `/v1/workflows` | List configured workflows. |
| `POST` | `/v1/auth/session/ws-ticket` | Mint a single-use WebSocket session ticket. |

## Authentication modes

`auth.kind` selects how the server authenticates requests:

| `auth.kind` | Behaviour |
| --- | --- |
| `'token'` (default) | Every endpoint except `/v1/health` (and, when `metrics.requireAuth = false`, `/v1/metrics`) requires a bearer token signed with HMAC-SHA256 against the deployment pepper. Scopes are enforced per route; the WebSocket upgrade authenticates by bearer header or a single-use ticket. |
| `'none'` | **Authentication is disabled.** Every endpoint — REST, the WebSocket upgrade, SSE and replay — is served to an anonymous, fully-authorized (`admin:*`) principal with no token. Intended only for **trusted loopback / single-operator** deployments. |

The `'none'` contract is explicit and total: there is no half-open state. Either you run with tokens, or every route (including run invocation and the live stream) is open to anyone who can reach the socket. `ws.enabled: true` is honoured under `'none'` — the upgrade mounts and accepts clients that present only the `graphorin.protocol.v1` subprotocol (no ticket needed). Because this removes all access control, the server prints a startup **warning** when `auth.kind='none'` is combined with a non-loopback `server.host` (e.g. `0.0.0.0`); bind a loopback host or switch to `auth.kind='token'` for any exposed deployment.

## WebSocket protocol

`@graphorin/protocol` ships the `graphorin.protocol.v1` contract — a typed message envelope for live event streaming over WebSocket. Built on [`@hono/node-ws`](https://github.com/honojs/middleware) (MIT).

```ts
import { GraphorinClient } from '@graphorin/client';

const client = new GraphorinClient({
  baseURL: 'wss://assistant.example.com',
  token: process.env.SERVER_TOKEN,
});

for await (const event of client.runAgent('planner', { prompt: 'Plan a hike.' })) {
  if (event.type === 'text.delta') process.stdout.write(event.delta);
}
```

The browser-friendly client is published as `@graphorin/client` and depends only on `@graphorin/protocol`. SSE is the documented fallback for environments that cannot upgrade to WebSocket.

Cancelling a run over the socket — the `run.cancel` request and the `notifications/cancelled` notification — requires the same **`agents:invoke`** scope as the REST `POST /v1/runs/:runId/abort` route. A `run.cancel` from a token without it is rejected with `SCOPE_DENIED` (`-32003`); a `notifications/cancelled` without it (or before `initialize`) is silently ignored, since a notification carries no id to reply on.

## Triggers

`@graphorin/triggers` is the durable scheduling layer. Four trigger kinds:

| Kind | Spec |
|---|---|
| `cron` | Standard 5-field cron expression. |
| `interval` | Fixed interval in milliseconds. |
| `idle` | Fires after N ms of agent inactivity. |
| `event` | Listens on a named event channel. |

Declare a trigger using the four typed factories:

```ts
import { cron, interval, idle, event, createScheduler } from '@graphorin/triggers';

const morningSummary = cron(
  'morning-summary',
  '0 8 * * *',
  async () => {
    await agent.run('Send the morning summary.');
  },
);

const scheduler = createScheduler({ store: sqlite.triggers });
await scheduler.register(morningSummary);
await scheduler.start();
```

The triggers daemon (mounted by `@graphorin/server`) owns the schedule, persists the next-firing time across restarts, fires the registered callback, and audits every fire decision.

### Background consolidation

When you pass **both** a `consolidator` and a triggers scheduler to `createServer({ consolidator, triggers })`, the server bridges them in `beforeStart`: it registers the consolidator's `cron` / `idle` triggers with the scheduler so background distillation actually runs — no manual `registerConsolidatorTriggers` call. The default trigger set is `idle:5m` (drives the light + standard phases between sessions) plus a daily `cron:0 4 * * *` that makes the **deep** phase reachable — deep drains the deferred conflict-check queue and runs reflection, and only `cron` / `manual` / `budget` reasons schedule it. `turn` / `event` triggers are **consumer-emitted**: the scheduler can't fire them on its own, so your agent loop must call `consolidator.trigger({ kind: 'turn' | 'event' }, scope)` itself. The bridge uses the consolidator's `defaultScope`, so configure one; and remember the default `free` tier pins the budget to zero (set a paid tier for distillation to do anything — see [Memory system](/guide/memory-system#background-consolidator)).

## Idempotency

Repeated submissions with the same `Idempotency-Key` + body return the original response **for the same principal only** — the record is bound to the executing token, a different token gets `409 idempotency-conflict` (IP-6). `POST /v1/tokens` is excluded from response caching entirely (it returns a raw secret), so repeated mint calls re-execute.

## Disconnect policy

Long-running streams (agent runs, workflows) survive client disconnects through the configurable `disconnect.policy`:

| Policy | Behaviour on client disconnect |
|---|---|
| `'continue'` (default) | Run continues; client reconnects via `GET /v1/agents/:id/runs/:runId/follow`. |
| `'pause'` | Run is paused; resumed when the client reconnects with the same `runId`. |
| `'abort'` | Run aborts with `client-disconnected`. |

## Health checks

`GET /v1/health` returns:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "checks": {
    "storage": "ok",
    "audit-log": "ok",
    "secrets": "ok",
    "triggers": "ok",
    "providers": { "openai": "ok", "ollama": "unreachable" }
  }
}
```

Provider checks are passive — the server never opens an outbound connection it doesn't already have.

## Prometheus metrics

`GET /metrics` exposes the counters from [Observability](/guide/observability#counters) in Prometheus exposition format, plus the standard process / Node.js metrics.

## Configuration

```toml
# graphorin.config.toml
[server]
host = "127.0.0.1"
port = 8787

[storage]
path = "./assistant.db"
encryption-at-rest = "keyring:graphorin_db_key?service=graphorin"

[secrets]
backend = "keychain"

[triggers]
enabled = true

[observability]
exporter = "otlp"
otlp-url = "https://otel.example.com/v1/traces"
```

The CLI command `graphorin start --config graphorin.config.toml` boots the server.

## Process model

Recommended deployment patterns:

- **systemd**: ship the unit template the project provides under `examples/systemd/`.
- **Docker**: ship the image template under `examples/docker/`.
- **Kubernetes**: ship the manifests under `examples/k8s/`.

All three templates run Graphorin as a **non-root** user with the audit log on its own mountpoint and the secrets store unreadable by the application's main filesystem path.

## Next steps

- [CLI](/guide/cli) — `graphorin start`, `graphorin doctor`, `graphorin token`.
- [Deployment](/guide/deployment) — production checklists.
- [Security](/guide/security) — server-token authentication, audit log.
- [Observability](/guide/observability) — what gets traced.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
