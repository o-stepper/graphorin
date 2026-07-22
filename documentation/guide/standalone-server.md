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
Most domain routes below mount **only when the corresponding adapter reaches `createServer({...})`**: sessions, memory, skills, MCP, audit, triggers, and replay routes need their adapter; `/v1/agents/*` and `/v1/workflows/*` need agents / workflows registered in the registries. A bare `graphorin start` composes none of these - it serves health, metrics, tokens, auth tickets, and the WS/SSE endpoints only. To serve the full surface from the daemon, point the config's `app` field at a compose module (see "Composing the full API surface" below); embedding the server programmatically with your own adapter bag works exactly as before.
:::

### Composing the full API surface (app module)

Set `app` in `graphorin.config.*` to a module path (relative to the config file) and `graphorin start` will import it, call its default-exported factory with `{ config, configPath, configDir }` (the validated config plus the config file's location), and spread the returned adapter bag into `createServer(...)`:

```ts
import { resolve } from 'node:path';

import type { GraphorinAppBag, GraphorinAppFactory } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';

const createApp: GraphorinAppFactory = async (ctx) => {
  const store = await createSqliteStore({
    path: resolve(ctx.configDir, ctx.config.storage.path),
    mode: ctx.config.storage.mode,
  });
  await store.init();
  const bag: GraphorinAppBag = {
    // The server reuses this store and never closes an injected one -
    // the close hook below owns it. Add sessions / memory / agents /
    // workflows adapters here as your app grows.
    store,
    close: async () => {
      await store.close();
    },
  };
  return bag;
};
export default createApp;
```

`graphorin init --app` scaffolds a working `graphorin.app.mjs` (SQLite store + memory + sessions REST adapters over the configured storage path) and wires the `app` field for you - edit it to add agents, workflows, or your own adapters. The optional `close` hook runs after `server.stop()` on shutdown, because the server never closes an injected store or other app-owned resources.

Which route groups are live per launch mode:

| Surface | Bare `graphorin start` | With an `app` module | Programmatic `createServer({...})` |
|---|---|---|---|
| `/v1/health`, `/v1/metrics`, tokens, auth tickets, WS/SSE endpoints | yes | yes | yes |
| `/v1/sessions/*` | 404 | when the bag has `sessions` | when options have `sessions` |
| `/v1/memory/*` | 404 | when the bag has `memory` | when options have `memory` |
| `/v1/agents/*` (list/invoke) | empty registry | when the bag has `agents` | when options have `agents` |
| `/v1/workflows/*` | empty registry | when the bag has `workflows` | when options have `workflows` |
| skills / MCP / audit / triggers / replay routes | 404 | when the bag has the adapter | when options have the adapter |

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/health` | Liveness + readiness summary (probes for storage, embedder, secrets, encryption, consolidator, triggers, workflow timers, replay buffer). |
| `GET` | `/v1/health/secrets` | Authenticated drilldown of the active `SecretsStore`. |
| `GET` | `/v1/metrics` | Prometheus exposition (path configurable; auth optional). |
| `GET` | `/v1/agents` | List registered agents. |
| `GET` | `/v1/agents/:id` | Describe a single agent. |
| `POST` | `/v1/agents/:id/run` | Run an agent synchronously and return the final output. |
| `POST` | `/v1/agents/:id/stream` | **Starts the run** and returns `202` with `runId` + the WS subject (`agent:<id>/runs/<runId>/events`) the events are emitted on. Subscribe over WebSocket; workflow runs use `workflow:<id>/runs/<runId>/events`. |
| `GET` | `/v1/runs/:runId/state` | Read the current `RunState`. |
| `POST` | `/v1/runs/:runId/abort` | Abort a run. |
| `POST` | `/v1/runs/:runId/resume` | Resume a suspended agent run: body `{ "approvals": [{ "toolCallId", "granted", "reason"?, "subRunToolCallId"? }] }`, scope `agents:invoke:<agentId>`. The tracker retains the resumable `RunState` when a run parks (`POST /agents/:id/run` suspension branch, or `runs.registerSuspended(...)` for proactive fires executed outside REST) and mirrors it into the durable `suspended_runs` sidecar (migration 038), so a park **survives a server restart**: boot hydration re-registers each row and this endpoint rehydrates it through the owning agent's `deserializeState` codec. A partially-resolved directive re-suspends and retains (and re-persists) the fresh state. `409 run-not-suspended` for a run that is not awaiting approval, `409 run-state-unavailable` when no state is retained or the registered agent ships no codec (resume those library-side via `agent.run(savedState, { directive })`), `409 agent-busy` when the instance has another run in flight, `500 run-state-invalid` for an unreadable durable payload. Suspended records are exempt from retention pruning and their rows are dropped when the run settles - settle them via resume or abort. |
| `POST` | `/v1/runs/:runId/replay` | Replay a recorded run from the audit / cassette artefacts. |
| `GET` | `/v1/sessions` | List sessions. |
| `POST` | `/v1/sessions` | Create a session. |
| `GET` | `/v1/sessions/:id` | Read a session. |
| `DELETE` | `/v1/sessions/:id` | Hard-delete a session with the full erasure cascade (content, session-scoped memory, suspended-run checkpoints, spans - see [Erasure and retention](/guide/privacy#erasure-and-retention)). |
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
| `GET` | `/v1/triggers/:id` | Single-trigger detail (`404` when the id does not exist). |
| `POST` | `/v1/triggers/:id/fire` | Fire a trigger immediately. |
| `POST` | `/v1/triggers/:id/disable` | **Flag flip** - pause the trigger; it stays registered and persisted. |
| `POST` | `/v1/triggers/:id/enable` | Re-enable a paused trigger (the next fire is recomputed from now). |
| `DELETE` | `/v1/triggers/:id` | **Destructive** - unregister and remove the trigger. |
| `POST` | `/v1/triggers/prune` | **Destructive** - body `{ disabled?: boolean = true, orphaned?: boolean = false }`. The default removes every disabled trigger (no cutoff; the CLI `graphorin triggers prune` adds `--before`). `orphaned: true` additionally removes persisted rows with no live declaration in this process - only the running server can tell those apart, the offline CLI cannot. |
| `GET` | `/v1/workflows` | List configured workflows. |
| `POST` | `/v1/workflows/:id/execute` | Start a workflow run in the background: `202` with `runId` + the WS subject (`workflow:<id>/runs/<runId>/events`). Scope `workflows:execute:<id>`. |
| | | On failure the run subject carries a `workflow.error` event whose payload is `{ runId, code, message, hint? }` - `code` is the machine-readable discriminator (`err.code`, falling back to `err.kind`, else `unknown`), so clients retry `checkpoint-version-conflict` and abandon `node-execution-failed` without parsing prose; the same `code` appears on the run-status `error` object. |
| `POST` | `/v1/workflows/:id/resume` | Resume a paused workflow thread (`threadId` in the body). An optional `name` targets a specific awakeable/approval among parallel pauses (approvals resolve through the same primitive). Mirrors execute: the run iterates in the background, `202` + `runId` + WS subject; `400` when the workflow does not implement the needed method. Scope `workflows:resume:<id>`. |
| `GET` | `/v1/workflows/:id/state` | Read a thread's state (`?threadId=...`); `400` when the workflow does not implement `getState()`; an unknown or deleted thread answers `404` with the `{ "error": "thread-not-found" }` envelope. Scope `workflows:read:<id>`. |
| `GET` | `/v1/workflows/:id/checkpoints` | List a thread's checkpoints (`?threadId=...`). Scope `workflows:read:<id>`. |
| `DELETE` | `/v1/workflows/:id/threads/:threadId` | Delete every checkpoint + pending write of one thread (idempotent; `204` on success, `400` when the entry does not expose `deleteThread()`). Scope `workflows:delete:<id>`. |
| `POST` | `/v1/workflows/:id/fork` | Fork a new thread from a checkpoint: body `{ fromThreadId, fromCheckpointId? }`, defaulting to the thread's latest checkpoint; answers `201 { newThreadId }`. Scope `workflows:execute:<id>`. |
| `POST` | `/v1/workflows/:id/retry` | Replay a failed/aborted thread in the background: body `{ threadId }`, answers `202 { runId }` with the WS subject. Scope `workflows:resume:<id>`. |
| `POST` | `/v1/workflows/:id/tick` | Fire a due durable timer synchronously: body `{ threadId }`, answers `{ fired, nextWakeAt }`. Long node bodies hold the connection - prefer the timer daemon (`createServer({ workflowTimers })`) for regular firing. Scope `workflows:resume:<id>`. |
| `POST` | `/v1/session/ws-ticket` | Mint a single-use WebSocket session ticket. |

::: info Terminal run state is short-lived
`GET /v1/runs/:runId/state` reads the in-memory run tracker, and terminal records (completed / aborted / failed) are retained for about 5 minutes after completion (`DEFAULT_RUN_RETENTION_MS = 5 * 60_000`). Once the periodic sweep prunes the record, the route answers `404 run-not-found`. Read the final state promptly (or consume the event stream) rather than treating the endpoint as durable storage.
:::

## Authentication modes

`auth.kind` selects how the server authenticates requests:

| `auth.kind` | Behaviour |
| --- | --- |
| `'token'` (default) | Every endpoint except `/v1/health` (and `/v1/metrics` only if you opt out via `metrics.requireAuth = false`) requires a bearer token signed with HMAC-SHA256 against the deployment pepper. Scopes are enforced per route; the WebSocket upgrade authenticates by bearer header or a single-use ticket. |
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

Cancelling a run over the socket - the `run.cancel` request and the `notifications/cancelled` notification - requires the run's OWNING resource scope, exactly like the REST `POST /v1/runs/:runId/abort` route: `agents:invoke:<agentId>` for agent runs, `workflows:execute:<workflowId>` for workflow runs; bare two-segment grants keep covering the per-resource requirement. Both surfaces resolve the run first (an unknown runId answers `RUN_NOT_FOUND` / `404` before any scope evaluation; runIds are unguessable and ephemeral, so this ordering is deliberate). A `run.cancel` outside the grant is rejected with `SCOPE_DENIED` (`-32003`) naming the required scope; a `notifications/cancelled` outside it (or before `initialize`) is silently ignored, since a notification carries no id to reply on. Session reads are symmetric too: `GET /v1/sessions/:id` (+`/messages`, `/handoffs`, `/export`, `DELETE`) and the SSE `GET /v1/sessions/:id/events` fallback require `sessions:<verb>:<sessionId>` per-resource, matching the WS subject gate - a bare two-segment `sessions:read` remains the global administrative read. `POST /v1/session/ws-ticket` requires only authentication: the ticket adds no rights (it carries the principal's own scopes, and every subscribe is per-subject gated).

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
  { timezone: 'Europe/Kyiv' },
);

const scheduler = createScheduler({ store: sqlite.triggers });
await scheduler.register(morningSummary);
await scheduler.start();
```

The triggers daemon (mounted by `@graphorin/server`) owns the schedule, persists the next-firing time across restarts, fires the registered callback, and audits every fire decision.

### Cron timezones and DST

Cron expressions evaluate in **UTC** by default. Pass `timezone` (an IANA zone name) in the declaration options to match the expression against that zone's wall clock instead; `cron(...)` validates the zone eagerly, so a typo throws at declaration time, never at first fire. The `day`/`dayOfWeek` AND-combination rule is unchanged and applies in the zone's calendar.

DST transitions follow Vixie cron semantics:

- **Fixed-time jobs** (neither the minute nor the hour field covers its full range, e.g. `30 2 * * *`): a wall time swallowed by a spring-forward gap runs **once immediately after the transition**; a wall time repeated by a fall-back overlap runs **only on the first pass**.
- **Wildcard jobs** (the minute or the hour field covers its full range, e.g. `*/30 * * * *`): no compensation - the job follows the new wall clock, so gap times never run and repeated times run on both passes.

`interval` / `idle` / `event` triggers ignore `timezone` (like the catch-up fields they do not use).

### Orphaned triggers and catch-up

Trigger rows are durable, but callbacks live only in memory: after a restart every declaration must be re-registered before `scheduler.start()`. A persisted row whose declaration was **not** re-registered can never fire; `start()` surfaces each such row with a WARN log and an `orphaned` scheduler event instead of skipping it silently, `Scheduler.orphans()` lists them, the daemon reports an `orphaned` count in `/v1/health`, and `POST /v1/triggers/prune { "orphaned": true }` removes them.

Register-time catch-up is gated on the scheduler lifecycle: when a trigger with a `catchupPolicy` is registered **before** `start()`, its missed fires are counted and applied during `start()` - user callbacks never run on a not-started scheduler.

### Scheduler harness for proactive fleets

A proactive bot lets an agent-driven code path register its own schedules, which needs guardrails a hand-written deployment does not. The harness is opt-in: pass `limits` to `createScheduler` and declare per-trigger shaping fields. Without `limits` the scheduler behaves exactly as before.

```ts
import { createScheduler, interval, cron } from '@graphorin/triggers';
import { createSqliteStore } from '@graphorin/store-sqlite';

const sqlite = await createSqliteStore({ path: './assistant.db' });

const scheduler = createScheduler({
  store: sqlite.triggers,
  // Opt-in harness: {} takes the conservative defaults.
  limits: {
    intervalFloorMs: 60_000, // default 60s; 0 disables the floor
    maxDeclarations: 32, // default: unlimited
  },
});

// Deterministic jitter: a stable per-id offset in [0, jitterMs] spreads
// a fleet sharing one wall-clock boundary without drifting any task.
const digest = cron('daily-digest', '0 8 * * *', async () => {}, {
  jitterMs: 120_000,
  // Auto-expiry: past this instant the trigger auto-pauses instead of
  // firing (non-destructive disabled flag + an 'expired' event).
  expiresAt: '2027-01-01T00:00:00Z',
});

await scheduler.register(digest);
await scheduler.start();
```

Semantics, in enforcement order:

- **Interval floor** - `register(...)` throws a `TriggerLimitError` (`limit: 'interval-floor'`) for an `interval` / `idle` period below `intervalFloorMs`. Deterministic and fail-fast so an agent-driven registration gets the violation back as feedback instead of a silently rewritten schedule. `cron` is minute-grained by construction and is not floored.
- **Declaration cap** - `maxDeclarations` bounds the number of registered declarations; re-registering an existing id never counts against the cap. Violation throws `TriggerLimitError` (`limit: 'max-declarations'`).
- **Deterministic jitter** - `jitterMs` on a `cron` / `interval` declaration shifts every armed delay by `hash(id) % (jitterMs + 1)`. The offset is stable across restarts and processes, applies to the armed timer only (the persisted schedule and catch-up math stay on the unjittered grid), and `idle` / `event` triggers ignore it.
- **Auto-expiry** - a trigger whose `expiresAt` passed auto-pauses instead of firing: the persistent `disabled` flag flips (exactly like `setDisabled(id, true)`), a WARN is logged and an `'expired'` scheduler event is published. The row stays registered for inspection; `POST /v1/triggers/prune { "disabled": true }` cleans it up. Renew by re-registering the declaration with a later `expiresAt` and calling `setDisabled(id, false)` - registration alone deliberately keeps the persisted disabled flag.

The floor and cap defaults are conservative (60s, unlimited); the actual values are bot policy. The [proactivity guide](/guide/proactivity) shows the harness composed with heartbeat and cron-leg tasks.

### Background consolidation

When you pass **both** a `consolidator` and a triggers scheduler to `createServer({ consolidator, triggers })`, the server bridges them during startup (the consolidator daemon starts first and registers its `cron` / `idle` triggers with the scheduler before the scheduler begins firing) so background distillation actually runs - no manual `registerWithScheduler` call. The default trigger set is `idle:5m` (drives the light + standard phases between sessions) plus a daily `cron:0 4 * * *` that makes the **deep** phase reachable - deep drains the deferred conflict-check queue and runs reflection, and only `cron` / `manual` / `budget` reasons schedule it. `turn` / `event` triggers are **consumer-emitted**: the scheduler can't fire them on its own, so your agent loop must call `consolidator.trigger({ kind: 'turn' | 'event' }, scope)` itself. A `buffer:N` trigger (consolidate once the unconsolidated transcript tail reaches N tokens) is evaluated on activity: the server's run tracker calls `scheduler.recordActivity()` on every tracked REST/WS run (making `idle:T` a true debounce) and `consolidator.notifyActivity()` when a run settles - see [Memory system](/guide/memory-system#the-buffer-trigger-and-activity-signals). The bridge uses the consolidator's `defaultScope`, so configure one; and remember the default `free` tier pins the budget to zero (set a paid tier for distillation to do anything - see [Memory system](/guide/memory-system#background-consolidator)).

## Channel gateway

The server hosts a channel gateway (the messenger front door from [`@graphorin/channels`](/guide/channels)) as a managed daemon - matched structurally, so the server takes no dependency on the channels package:

```ts no-check
import { createServer } from '@graphorin/server';

const server = await createServer({
  store,
  triggers: { scheduler },
  channels: { gateway }, // or { daemon: createChannelsDaemon({ gateway }) }
});
```

Lifecycle ordering is part of the contract: the gateway starts LAST (inbound traffic only begins once the consolidator, scheduler and durable timers are live) and stops FIRST (the front door closes before shutdown drains in-flight runs). `/v1/health` gains a `channels` check aggregating the per-channel counters (`running`, `channels`, `queued`, `dropped`, `failed`; a stopped gateway reports `warn`, a failing `status()` reports `fail`). When a triggers scheduler is wired alongside, the server registers the gateway's activity listener so every ACCEPTED inbound message calls `scheduler.recordActivity()` - channel traffic debounces `idle:T` triggers exactly like tracked REST/WS runs.

## Idempotency

Repeated submissions with the same `Idempotency-Key` + body return the original response **for the same principal only** - the record is bound to the executing token, a different token gets `409 idempotency-conflict`. `POST /v1/tokens` is excluded from response caching entirely (it returns a raw secret), so repeated mint calls re-execute. Expired idempotency records (each stores the full response body) are swept from the database automatically by the unified [retention sweep](#retention); the read path already refuses to replay them, so the sweep changes no replay semantics.

## Disconnects and reconnection

Runs are **not** tied to the client connection: a background run started via `POST /v1/agents/:id/stream` (or a workflow execute/resume) keeps running when the subscriber drops. To catch up, reconnect over WebSocket and resubscribe to the run subject (`agent:<id>/runs/<runId>/events`) passing your last seen `eventId` - the server replays missed events from its bounded replay buffer. The SSE endpoint honours the standard `Last-Event-ID` header the same way. There is no per-run pause/abort-on-disconnect policy.

## Health checks

`GET /v1/health` returns the rollup, the server version, the uptime, and a per-check breakdown (every check is an object carrying a `status` of `ok` / `warn` / `fail` plus check-specific detail fields):

```json
{
  "status": "ok",
  "version": "0.13.13",
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

::: warning Concurrent CLI writes stall the event loop - liveness implications
`better-sqlite3` is synchronous: when an operator CLI command holds the write
lock on the same database file (the "contends" rows of the
[concurrency matrix](/guide/storage#concurrency-matrix)), the server's next
write blocks the whole event loop for up to `busy_timeout` (default 5 s,
`busyTimeoutMs` in the storage options) per contended statement - and a
blocked event loop cannot answer `/v1/health` either. Under Kubernetes,
several back-to-back stalls can exhaust a liveness probe's failure threshold
and restart a healthy pod: budget probe `timeoutSeconds`/`failureThreshold`
above the configured busy timeout, or keep write-side CLI maintenance to
windows.
:::

## Prometheus metrics

`GET /v1/metrics` exposes the `graphorin_*` series from [Observability](/guide/observability#counters) in Prometheus exposition format. The registry deliberately omits the stock process / Node.js collectors - only framework series are emitted. With `metrics.requireAuth = true` (the default since 0.12.0) the endpoint mounts behind the standard auth boundary and requires the `admin:metrics:read` scope (an `admin:*` grant matches) - point your scraper at the endpoint with an `Authorization: Bearer <token>` header (Prometheus: `authorization.credentials_file`). Setting `requireAuth = false` serves the exposition unauthenticated for trusted-network scrapes; on a non-loopback bind the server logs a WARN because the labels leak operational detail (trigger ids, consolidator budgets).

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

### Retention

The `retention` section drives a unified periodic sweep over the store's growth surfaces (default: every 6 hours, plus one sweep immediately at startup). Derived data is pruned out of the box - spans older than `spansDays` (30), consolidator run counters older than `consolidatorRunsDays` (90), exhausted DLQ batches older than `dlqExhaustedDays` (30), and expired idempotency records (`idempotency: true`). Primary user content is strictly opt-in: sessions (`sessionsDays`, with `sessionsClosedOnly` defaulting to `true`), the session audit trail (`auditDays`), memory history (`memoryHistoryDays`) and terminal workflow threads (`workflowThreadsDays`) are only touched when you set the matching window. `retention: { enabled: false }` disables the sweep entirely. Each surface is isolated: one failing prune logs a warning (via the `observability.logger` flavour) and never blocks the others. See the [deployment guide](/guide/deployment#retention-and-database-growth) for the full growth-surface table, including the file-based replay-JSONL directory that must be pruned via cron instead.

## Process model

Recommended deployment patterns:

- **systemd**: ship the unit template the project provides under `examples/systemd/`.
- **Docker**: ship the image template under `examples/docker/`.
- **Kubernetes**: ship the manifests under `examples/k8s/`.

All three templates run Graphorin as a **non-root** user with the audit log on its own mountpoint and the secrets store unreadable by the application's main filesystem path.

**TLS**: the server speaks plaintext HTTP only - there is deliberately no in-process TLS. Terminate TLS at a reverse proxy (Caddy, nginx, an ingress controller); every shipped template assumes one in front. Binding a non-loopback host logs a startup WARN until you acknowledge the proxy with `server.tlsTerminatedUpstream: true` (the flag changes no runtime behaviour - it records the operator's intent and silences the warning).

## Next steps

- [CLI](/guide/cli) - `graphorin start`, `graphorin doctor`, `graphorin token`.
- [Deployment](/guide/deployment) - production checklists.
- [Security](/guide/security) - server-token authentication, audit log.
- [Observability](/guide/observability) - what gets traced.

