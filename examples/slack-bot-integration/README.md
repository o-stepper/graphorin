# `examples/slack-bot-integration`

> Server-mode acceptance demo: a Slack bot bridges inbound webhook
> events into a Graphorin agent, streams the assistant reply back to
> Slack via `chat.postMessage`, and survives a `pkill graphorin` mid-
> approval boundary thanks to the SQLite-backed durable HITL flow.

The smoke test stubs the real Slack `WebClient` and the LLM provider -
`pnpm test` exits in well under a second and never touches the network.

---

## Slack app setup

1. Create a new Slack app at <https://api.slack.com/apps> and choose
   the workspace you want to host the bot in.
2. **OAuth scopes** (Bot Token Scopes):
   - `chat:write` (post replies and approval prompts).
   - `app_mentions:read` (drive the bot from `@graphorin` mentions).
   - `channels:history` / `groups:history` / `im:history` (consume
     message events from the channels you invite the bot into).
3. **Event Subscriptions**: enable, set the request URL to
   `https://<your-host>/slack/events`, and subscribe to
   `app_mention` + `message.channels` (and `message.im` if you want
   DM support).
4. Save the **signing secret** under `GRAPHORIN_SLACK_SIGNING_SECRET`
   in the deployment environment. The bridge validates every inbound
   request with HMAC-SHA256 before forwarding it to the agent loop.
5. Save the **bot token** (`xoxb-…`) and inject it into your real
   `SlackClient` adapter - the example ships a stub that records every
   `chat.postMessage` call into an in-memory log; production callers
   pass `slackClient: new SlackWebApiAdapter(token)` instead.

A minimal app manifest you can drop into the Slack UI:

```yaml
display_information:
  name: graphorin-bot
features:
  bot_user:
    display_name: graphorin
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - app_mentions:read
      - channels:history
      - groups:history
      - im:history
settings:
  event_subscriptions:
    request_url: https://your-host.example.com/slack/events
    bot_events:
      - app_mention
      - message.channels
      - message.im
  interactivity:
    is_enabled: true
    request_url: https://your-host.example.com/slack/interactions
```

---

## Bridge architecture

```
                ┌────────────┐
   POST /events │   Slack    │ chat.postMessage
   ┌───────────▶│ workspace  │◀───────────┐
   │            └────────────┘            │
   │                                      │
   │ webhook (HMAC verified)              │ assistant reply
   │                                      │
┌──┴──────────────┐   stream    ┌─────────┴─────────┐
│ Slack adapter   │────────────▶│  Graphorin server │
│ (this example)  │   events    │  (createServer)   │
└─────────────────┘◀────────────└────────┬──────────┘
        ▲                                │
        │ approve / deny button click    │ tool.approval.requested
        │                                │ + checkpoint persisted
        │                                ▼
        │                       ┌──────────────────┐
        │                       │   SQLite (WAL)   │
        └───────────────────────┤ CheckpointStore  │
                                └──────────────────┘
```

The example wires every layer in one process: `createSlackBotApp({...})`
returns a typed handle exposing `agent`, `server`, `slackClient`,
`processSlackEvent`, `handleSlackApproval`, and `listPendingApprovals`.
Production deployments are free to split the listener (a Hono `/slack/
events` route mounted on the framework's `GraphorinServer.app`) from
the agent host (`@graphorin/server` running on a different node) - the
contract between them is the same `RunState` shape that `agent.run`
serializes to the checkpoint store.

---

## Library-mode quickstart

```ts
import { createSlackBotApp, processSlackEvent } from '@graphorin/example-slack-bot-integration';

const app = await createSlackBotApp({
  recipe: 'stub',
  dbPath: './.graphorin/slack-bot.db',
});

const result = await processSlackEvent({
  app,
  event: {
    type: 'event_callback',
    event: {
      type: 'message',
      user: 'U12345',
      text: 'Hello, graphorin!',
      channel: 'C-bridge',
      ts: '1700000000.000010',
    },
  },
  rawBody: '<raw json body>',
  headers: {
    'x-slack-request-timestamp': '1700000000',
    'x-slack-signature': 'v0=...',
  },
});
console.log(result.status, result.assistantText);
```

The `skipSignatureCheck: true` option short-circuits the HMAC step -
useful for the smoke test, never for production traffic.

---

## Durable HITL approval lifecycle

`simulateApprovalLifecycle({...})` is the headline helper. It exercises
the full `pkill graphorin && restart → resume` story end-to-end against
the deterministic stub provider:

```ts
import { createSlackBotApp, simulateApprovalLifecycle } from '@graphorin/example-slack-bot-integration';
import { createSqliteStore } from '@graphorin/store-sqlite';

const store = await createSqliteStore({ path: './.graphorin/slack-bot.db' });
await store.init();

const app = await createSlackBotApp({ store, sessionId: 'approval-flow' });

const result = await simulateApprovalLifecycle({
  app,
  expense: { amount: 500, justification: 'engineering offsite travel' },
  decision: 'approve',
  reason: 'OK',
  // The factory closes the in-flight handle and re-opens a brand-new
  // app on top of the same SQLite store - bytes-equivalent to a process
  // restart from the agent runtime's perspective.
  restartFactory: async (oldApp) => {
    await oldApp.close();
    return createSlackBotApp({ store, sessionId: 'approval-flow' });
  },
});

console.log(result.resume.status); // 'completed'
console.log(result.pendingAfterRestart.length); // 1 - surfaced from the checkpoint store.
console.log(result.slackMessages.map((m) => m.text));
```

Key pieces of the durable contract:

1. The agent's `submit_expense` tool sets `needsApproval: (args) =>
   args.amount > 100` (DEC-018 default). The runtime intercepts the
   tool call, stamps `state.pendingApprovals` with the request, emits
   `tool.approval.requested`, and persists the entire `RunState` via
   `agent.config.checkpointStore.put(...)` under namespace `'agent'`.
2. The bridge inserts a small routing row into a bespoke
   `slack_pending_approvals` table on the same SQLite connection so the
   `(runId → channel, threadTs, expense)` mapping survives the restart
   alongside the checkpoint.
3. After the simulated `pkill graphorin && restart`, a fresh
   `createSlackBotApp({ store })` call enumerates the routing rows via
   `app.listPendingApprovals()` and recovers the suspended `RunState`
   via `store.checkpoints.getTuple(runId, 'agent')`.
4. `app.handleSlackApproval({ runId, decision: 'approve', reason })`
   resumes the agent with
   `agent.run(savedState, { directive: { approvals: [...] } })`. The
   runtime synthesizes a tool result message inline (the tool itself
   does not re-execute), the stub provider notices the approved tool
   payload, and the final assistant message lands in Slack via the
   stub `chat.postMessage` call.

---

## Multi-client coordination

The agent + memory + sessions live behind a single SQLite store, so a
CLI client (see [`examples/personal-assistant-cli`](../personal-assistant-cli))
sharing the same `dbPath` and `sessionId` observes every Slack-driven
turn (and vice versa). Operators commonly run both surfaces side-by-
side: the CLI for ad-hoc REPL traffic, the Slack bridge for chat-room
collaboration. The framework's six-tier memory stack consolidates both
input streams into the same working / session / episodic / semantic
tiers without per-client divergence.

---

## Token-based auth (HMAC + pepper)

The smoke test exercises the framework's bearer-token path end-to-end
against the in-process Hono app - `listen: false` skips the socket, so
no port binding is required. (By default `server.start()` binds a real
listener; `startSlackBotApp` returns the actually-bound `{ host, port }`
address - pass `server: { port: 0 }` for an ephemeral port.)

```ts
import { createSlackBotApp } from '@graphorin/example-slack-bot-integration';
import { createToken } from '@graphorin/security';
import { resolveSecret } from '@graphorin/security/secrets';

process.env.GRAPHORIN_SLACK_BOT_PEPPER = '<32-byte-random-pepper>';

const app = await createSlackBotApp({
  server: { auth: { enabled: true, pepperEnvVar: 'GRAPHORIN_SLACK_BOT_PEPPER' }, listen: false },
});
await app.server.start();

const pepper = await resolveSecret('env:GRAPHORIN_SLACK_BOT_PEPPER');
const minted = await createToken({
  tokenStore: app.store.authTokens,
  pepper,
  env: 'live',
  scopes: ['agents:invoke'],
});
const raw = await minted.raw.use((value) => value);

// In a deployment you run `graphorin token issue --scopes agents:invoke`
// to mint the same token via the CLI.
const res = await app.server.app.request('/v1/agents/slack-bot/run', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${raw}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'slack-bridge-key-1',
  },
  body: JSON.stringify({ input: 'Hello, graphorin!' }),
});
```

The pepper is supplied as a `SecretRef` (`env:GRAPHORIN_SLACK_BOT_PEPPER`
in the smoke test); `keyring:` and `encrypted-file:` schemes are also
supported out of the box.

---

## Scripts

| Command           | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `pnpm dev`        | Run the example end-to-end against the in-memory stub Slack.   |
| `pnpm build`      | Produce the `dist/` bundle via `tsdown`.                       |
| `pnpm test`       | Vitest smoke coverage (4 cases, < 30 s).                       |
| `pnpm typecheck`  | `tsc --noEmit` against the strict workspace tsconfig.          |
| `pnpm lint`       | Biome check (formatter + linter).                              |

---

## Files

| Path                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `src/main.ts`              | Bridge wiring, durable HITL helper, CLI entry point.                 |
| `src/expense-tool.ts`      | `submit_expense` tool with `needsApproval: amount > $100`.           |
| `src/slack-stub.ts`        | `SlackClient` interface + in-memory recorder used by tests.         |
| `src/stub-provider.ts`     | Deterministic `Provider` that drives the approval flow.              |
| `tests/smoke.test.ts`      | Version, happy-path, durable HITL, token-auth coverage.              |

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.10.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
