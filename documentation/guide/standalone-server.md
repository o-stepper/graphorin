---
title: Standalone server
description: Promote your assistant to a daemon with REST + WebSocket + SSE fallback, durable triggers, replay, Prometheus metrics, and health checks.
---

# Standalone server

`@graphorin/server` is the optional standalone runtime. Same library packages, different lifetime - promote your assistant to a daemon with a network API the moment it has to outlive a single Node.js process.

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
| Agent runs | yes | yes |
| Memory + sessions | yes | yes |
| Workflows | yes | yes |
| Tools / Skills / MCP | yes | yes |
| Durable HITL across **process restart** | yes (with the right checkpoint store) | yes |
| Triggers (cron / interval / idle / event) | manual scheduling | yes (daemon) |
| REST + WebSocket + SSE | no | yes |
| Server-token authentication | no | yes |
| Prometheus metrics endpoint | no | yes |
| Health checks | no | yes |
| Replay endpoint | manual via SQLite | yes |

## REST surface

Built on [`hono`](https://github.com/honojs/hono) (MIT) and [`@hono/node-server`](https://github.com/honojs/node-server) (MIT). The default `basePath` is `/v1`. Every authenticated endpoint requires a bearer token signed with HMAC-SHA256 against the deployment-wide pepper. The unauthenticated `/v1/health` route is exempt.

::: warning Adapter-gated routes - what `graphorin start` actually serves
Most domain routes below mount **only when the corresponding adapter is passed to `createServer({...})` programmatically**: sessions, memory, skills, MCP, audit, triggers, and replay routes need their adapter; `/v1/agents/*` and `/v1/workflows/*` need agents / workflows registered in the registries. The `graphorin start` daemon currently composes **none of these** - it serves health, metrics, tokens, auth tickets, and the WS/SSE endpoints only. To get the full surface, embed the server: build your adapter bag and call `createServer({ agents, workflows, sessions, memory, ... })` from your own entrypoint. A config-driven compose hook for `graphorin start` is tracked as future work.
:::

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/health` | Liveness + readiness summary (probes for storage, embedder, secrets, encryption, consolidator, triggers, replay buffer). |
| `GET` | `/v1/health/secrets` | Authenticated drilldown of the active `SecretsStore`. |
| `GET` | `/v1/metrics` | Prometheus exposition (path configurable; auth optional). |
| `GET` | `/v1/agents` | List registered agents. |
| `GET` | `/v1/agents/:id` | Describe a single agent. |
| `POST` | `/v1/agents/:id/run` | Run an agent synchronously and return the final output. |
| `POST` | `/v1/agents/:id/stream` | **Starts the run** and returns `202` with `runId` + the WS subject (`agent:<id>/runs/<runId>/events`) the events are emitted on (IP-2). Subscribe over WebSocket; workflow runs use `workflow:<id>/runs/<runId>/events`. |
| `GET` | `/v1/runs/:runId/state` | Read the current `RunState`. |
| `POST` | `/v1/runs/:runId/abort` | Abort a run. |
| `POST` | `/v1/runs/:runId/resume` | Answers an honest `501 resume-not-implemented` today (IP-14); resume programmatically via the library `agent.run(state, { directive })`. |
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
| `POST` | `/v1/triggers/:id/disable` | **Flag flip** - pause the trigger; it stays registered and persisted. |
| `POST` | `/v1/triggers/:id/enable` | Re-enable a paused trigger (the next fire is recomputed from now). |
| `DELETE` | `/v1/triggers/:id` | **Destructive** - unregister and remove the trigger. |
| `GET` | `/v1/workflows` | List configured workflows. |
| `POST` | `/v1/workflows/:id/execute` | Start a workflow run in the background: `202` with `runId` + the WS subject (`workflow:<id>/runs/<runId>/events`). Scope `workflows:execute:<id>`. |
| `POST` | `/v1/workflows/:id/resume` | Resume a paused workflow thread (`threadId` in the body). Mirrors execute: the run iterates in the background, `202` + `runId` + WS subject; `400` when the workflow does not implement `resume()`. Scope `workflows:resume:<id>`. |
| `GET` | `/v1/workflows/:id/state` | Read a thread's state (`?threadId=...`); `400` when the workflow does not implement `getState()`. Scope `workflows:read:<id>`. |
| `GET` | `/v1/workflows/:id/checkpoints` | List a thread's checkpoints (`?threadId=...`). Scope `workflows:read:<id>`. |
| `POST` | `/v1/workflows/:id/fork` | **Not implemented** on the server surface yet: answers an honest `501`; fork the thread programmatically via the workflow API. Scope `workflows:execute:<id>`. |
| `POST` | `/v1/session/ws-ticket` | Mint a single-use WebSocket session ticket. |

::: info Terminal run state is short-lived
`GET /v1/runs/:runId/state` reads the in-memory run tracker, and terminal records (completed / aborted / failed) are retained for about 5 minutes after completion (`DEFAULT_RUN_RETENTION_MS = 5 * 60_000`). Once the periodic sweep prunes the record, the route answers `404 run-not-found`. Read the final state promptly (or consume the event stream) rather than treating the endpoint as durable storage.
:::

## Authentication modes

`auth.kind` selects how the server authenticates requests:

| `auth.kind` | Behaviour |
| --- | --- |
| `'token'` (default) | Every endpoint except `/v1/health` (and, when `metrics.requireAuth = false`, `/v1/metrics`) requires a bearer token signed with HMAC-SHA256 against the deployment pepper. Scopes are enforced per route; the WebSocket upgrade authenticates by bearer header or a single-use ticket. |
| `'none'` | **Authentication is disabled.** Every endpoint - REST, the WebSocket upgrade, SSE and replay - is served to an anonymous, fully-authorized (`admin:*`) principal with no token. Intended only for **trusted loopback / single-operator** deployments. |

The `'none'` contract is explicit and total: there is no half-open state. Either you run with tokens, or every route (including run invocation and the live stream) is open to anyone who can reach the socket. `ws.enabled: true` is honoured under `'none'` - the upgrade mounts and accepts clients that present only the `graphorin.protocol.v1` subprotocol (no ticket needed). Because this removes all access control, the server prints a startup **warning** when `auth.kind='none'` is combined with a non-loopback `server.host` (e.g. `0.0.0.0`); bind a loopback host or switch to `auth.kind='token'` for any exposed deployment.

## WebSocket protocol

`@graphorin/protocol` ships the `graphorin.protocol.v1` contract - a typed message envelope for live event streaming over WebSocket. Built on [`@hono/node-ws`](https://github.com/honojs/middleware) (MIT).

```ts
import { GraphorinClient } from '@graphorin/client';

// 1. Start the run over REST. The route answers 202 with the runId
//    and the WS subject the events are emitted on.
const res = await fetch('https://assistant.example.com/v1/agents/planner/stream', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.SERVER_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ input: 'Plan a hike.' }),
});
const { runId } = (await res.json()) as { runId: string };

// 2. Subscribe to the run's event stream over WebSocket.
const client = new GraphorinClient({
  baseUrl: 'wss://assistant.example.com',
  auth: { kind: 'bearer', token: process.env.SERVER_TOKEN ?? '' },
});
await client.connect();

const sub = await client.subscribe({ target: 'agent', id: 'planner', runId });
for await (const event of sub.events()) {
  if (event.type === 'text.delta') {
    process.stdout.write((event.payload as { delta: string }).delta);
  }
}
```

The browser-friendly client is published as `@graphorin/client` and depends only on `@graphorin/protocol`. SSE is the documented fallback for environments that cannot upgrade to WebSocket.

Cancelling a run over the socket - the `run.cancel` request and the `notifications/cancelled` notification - requires the same **`agents:invoke`** scope as the REST `POST /v1/runs/:runId/abort` route. A `run.cancel` from a token without it is rejected with `SCOPE_DENIED` (`-32003`); a `notifications/cancelled` without it (or before `initialize`) is silently ignored, since a notification carries no id to reply on.

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
import { createSqliteStore } from '@graphorin/store-sqlite';
import type { Agent } from '@graphorin/agent';

declare const agent: Agent; // your assembled agent (see the agent-runtime guide)

const sqlite = await createSqliteStore({ path: './assistant.db' });

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

When you pass **both** a `consolidator` and a triggers scheduler to `createServer({ consolidator, triggers })`, the server bridges them in `beforeStart`: it registers the consolidator's `cron` / `idle` triggers with the scheduler so background distillation actually runs - no manual `registerConsolidatorTriggers` call. The default trigger set is `idle:5m` (drives the light + standard phases between sessions) plus a daily `cron:0 4 * * *` that makes the **deep** phase reachable - deep drains the deferred conflict-check queue and runs reflection, and only `cron` / `manual` / `budget` reasons schedule it. `turn` / `event` triggers are **consumer-emitted**: the scheduler can't fire them on its own, so your agent loop must call `consolidator.trigger({ kind: 'turn' | 'event' }, scope)` itself. The bridge uses the consolidator's `defaultScope`, so configure one; and remember the default `free` tier pins the budget to zero (set a paid tier for distillation to do anything - see [Memory system](/guide/memory-system#background-consolidator)).

## Idempotency

Repeated submissions with the same `Idempotency-Key` + body return the original response **for the same principal only** - the record is bound to the executing token, a different token gets `409 idempotency-conflict` (IP-6). `POST /v1/tokens` is excluded from response caching entirely (it returns a raw secret), so repeated mint calls re-execute.

## Disconnects and reconnection

Runs are **not** tied to the client connection: a background run started via `POST /v1/agents/:id/stream` (or a workflow execute/resume) keeps running when the subscriber drops. To catch up, reconnect over WebSocket and resubscribe to the run subject (`agent:<id>/runs/<runId>/events`) passing your last seen `eventId` - the server replays missed events from its bounded replay buffer. The SSE endpoint honours the standard `Last-Event-ID` header the same way. There is no per-run pause/abort-on-disconnect policy.

## Health checks

`GET /v1/health` returns the rollup, the server version, the uptime, and a per-check breakdown (every check is an object carrying a `status` of `ok` / `warn` / `fail` plus check-specific detail fields):

```json
{
  "status": "ok",
  "version": "0.6.0",
  "uptimeSeconds": 4711,
  "checks": {
    "storage": { "status": "ok" },
    "embedder": { "status": "ok" },
    "secrets": { "status": "ok" },
    "encryption": { "status": "ok" },
    "consolidator": { "status": "ok" },
    "triggers": { "status": "ok" },
    "replayBuffer": { "status": "ok" }
  }
}
```

The route answers `200` for both `ok` and `degraded` rollups so liveness probes do not flap on minor degradations (e.g. WAL above the warn threshold); only a `failing` rollup short-circuits with `503`.

## Prometheus metrics

`GET /v1/metrics` exposes the `graphorin_*` series from [Observability](/guide/observability#counters) in Prometheus exposition format. The registry deliberately omits the stock process / Node.js collectors - only framework series are emitted.

## Configuration

```js
// graphorin.config.mjs
import { defineConfig } from '@graphorin/server';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 8787,
  },
  storage: {
    path: './assistant.db',
    encryption: {
      enabled: true,
      cipher: 'sqlcipher',
      passphraseRef: 'keyring:graphorin_db_key?service=graphorin',
    },
  },
  secrets: {
    source: 'keyring',
  },
  observability: {
    logger: 'json',
  },
});
```

The CLI command `graphorin start --config graphorin.config.mjs` boots the server. The config loader reads `.ts` / `.js` / `.mjs` / `.json` files (TOML is not supported); `defineConfig` is a typed pass-through that gives editor autocomplete over the full schema, and every field is optional with a documented default.

## Process model

Recommended deployment patterns:

- **systemd**: ship the unit template the project provides under `examples/systemd/`.
- **Docker**: ship the image template under `examples/docker/`.
- **Kubernetes**: ship the manifests under `examples/k8s/`.

All three templates run Graphorin as a **non-root** user with the audit log on its own mountpoint and the secrets store unreadable by the application's main filesystem path.

## Next steps

- [CLI](/guide/cli) - `graphorin start`, `graphorin doctor`, `graphorin token`.
- [Deployment](/guide/deployment) - production checklists.
- [Security](/guide/security) - server-token authentication, audit log.
- [Observability](/guide/observability) - what gets traced.

---

**Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko
