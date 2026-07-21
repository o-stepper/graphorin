# assistant-bot

> The official whole-bot recipe for **graphorin** - one long-living personal assistant composed from every framework leg: `createAgent` with typed tools (one `needsApproval: true` HITL gate), `createMemory` auto-recall over SQLite, `SessionManager` persistence with JSONL export, the `createServer` REST surface driving run -> `awaiting_approval` -> resume, a `createHeartbeat` proactivity beat, and the `@graphorin/channels` front door with pairing + sanitization + identity routing.

Every other example demonstrates one leg in depth; this one shows how the legs compose into a bot. The whole flow is deterministic: an in-tree stub `Provider` plays the model, SQLite runs `:memory:`, and the only "network" is the in-process hono `server.app.request(...)` - no sockets, no LLM, no model downloads.

---

## First 5 minutes

If you only want to see the whole bot run end-to-end:

```bash
pnpm install
pnpm --filter ./examples/assistant-bot build
pnpm --filter ./examples/assistant-bot test
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/assistant-bot dev
```

Expected dev output:

```
graphorin v0.13.11 assistant-bot: OK - recipe='stub', recall='Lisbon', hitl=completed(gated-executions=1), heartbeat=notify, session-messages=7.
```

**What just happened?**

1. Two operator facts were ingested into semantic memory (`memory.semantic.remember`).
2. An unknown messenger peer knocked on the channels front door, got a **pairing challenge**, and the operator approved the code.
3. The paired peer asked *"Which favourite city should I plan the weekend trip around?"* - the context engine auto-recalled the ingested fact into the system prompt and the agent answered **from memory** ("... Lisbon").
4. A REST run (`POST /v1/agents/assistant/run`) stored a reminder with the ungated tool, then **parked on the gated `send_daily_summary` tool** (`status: 'awaiting_approval'`); `POST /v1/runs/:runId/resume` carried the human approval back and the gated tool executed exactly once.
5. A **heartbeat beat** reviewed the pending reminder checklist and delivered a `notify` outcome.
6. The session captured all 7 messages; the JSONL export round-trips the whole conversation.

---

## Quick map of the source

```
examples/assistant-bot/
├── src/
│   ├── main.ts              # createAssistantBotApp(...) wiring + per-leg helpers + CLI demo
│   └── stub-provider.ts     # Deterministic role-dispatched stub Provider (no network)
├── tests/
│   └── smoke.test.ts        # 5 vitest cases, one per composed leg
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## The composed legs

### 1. Agent + typed tools (one HITL gate)

Three tools built with the `tool({...})` factory operate on plain app state mounted via `deps`. The `send_daily_summary` tool carries `needsApproval: true`, so the agent runtime parks the run before executing it:

```ts
export function buildSendDailySummaryTool() {
  return tool({
    name: 'send_daily_summary',
    description: 'Send the daily summary to the operator (requires human approval).',
    inputSchema: z.object({}),
    sideEffectClass: 'side-effecting',
    needsApproval: true,
    async execute(_input, ctx) {
      const deps = ctx.runContext.deps as AssistantBotDeps;
      // ...executes only after the human approves.
    },
  });
}
```

`add_reminder` (side-effecting, ungated) and `list_reminders` (read-only, tagged `sensitivity: 'secret'` so the data-flow guard's lethal-trifecta leg arms) complete the catalogue.

### 2. Memory: ingest early, recall later

`createMemory` runs over `createSqliteStore({ skipSqliteVec: true })` - recall rides the FTS5 leg of hybrid search, no native vector extension needed. The agent opts into the memory-aware system prompt, and a custom auto-recall strategy fires on every turn:

```ts
const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
  contextEngine: {
    compaction: false,
    factsAutoRecall: {
      topK: 3,
      strategy: defineAutoRecallStrategy({
        id: 'assistant-bot-always',
        evaluate: () => ({ factsTriggered: true, reason: 'demo-always-recall' }),
      }),
    },
    privacy: { providerTrust: 'loopback' }, // the stub never leaves the process
  },
  resolveScope: () => scope,
});

const agent = createAgent({ /* ... */ memory, autoAssembleContext: true });
```

The proof of recall is structural: the stub provider can only answer the city question by parsing the `<auto_recalled_facts>` block the context engine injected. A reply naming Lisbon means the fact round-tripped storage -> FTS recall -> Layer 6 assembly.

### 3. Sessions: one conversation, exported as JSONL

Every turn (ingest ack, front-door exchange, REST approval flow, heartbeat note) is pushed into one `Session`; `session.export({ sink })` streams the `graphorin-session-export/1.0` JSONL document:

```ts
const { footer, body } = await exportSessionJsonl(app.session);
// footer.messageCount -> 7; body contains the question, the recalled
// fact, the 'daily-summary-sent' receipt, and the '[heartbeat]' note.
```

### 4. Server: the HITL loop over REST

`createServer({ skipListen: true })` boots the full middleware stack without binding a port; the demo drives it through in-process requests. Auth is real: token mode with a pepper resolved from `env:GRAPHORIN_ASSISTANT_BOT_PEPPER`, and a bearer token minted with `createToken({ scopes: ['agents:read', 'agents:invoke'] })`:

```ts
const runRes = await app.server.app.request('/v1/agents/assistant/run', {
  method: 'POST',
  headers: authHeaders(app),
  body: JSON.stringify({ input: APPROVAL_TASK, sessionId, userId }),
});
// -> { runId, status: 'awaiting_approval', result: { state: { pendingApprovals: [...] } } }

await app.server.app.request(`/v1/runs/${runId}/resume`, {
  method: 'POST',
  headers: authHeaders(app),
  body: JSON.stringify({ approvals: [{ toolCallId, granted: true }] }),
});
// -> { status: 'completed' }; the gated tool executed exactly once.
```

A second resume returns `409 run-not-suspended` - approvals are not replayable.

### 5. Proactivity: the heartbeat beat

`createHeartbeat` registers its schedule on the durable `@graphorin/triggers` scheduler (lib mode) and runs a dedicated cheap agent (`scaffold: 'minimal'`) per beat. An empty checklist skips the beat before any model call; a real finding becomes a `notify` outcome:

```ts
const heartbeat = createHeartbeat({
  agent: heartbeatAgent,
  scheduler: withLibModeAcknowledged(scheduler),
  schedule: { every: 5 * 60_000 },
  checklist: () => (pending.length === 0 ? null : renderChecklist(pending)),
  onOutcome: (outcome) => heartbeatOutcomes.push(outcome),
});
await heartbeat.beat(); // deterministic fire - no wall-clock wait
```

An all-quiet model reply (`HEARTBEAT_OK`) would be suppressed by the sentinel filter instead of delivered.

### 6. Channels: the messenger front door

The loopback testkit adapter stands in for a vendor transport. The pipeline per inbound message: pairing policy (durable SQLite `PairingStore`) -> inbound sanitization + taint seed -> identity routing -> agent run -> outbound scaffolding scrub:

```ts
const gateway = createChannelGateway({
  adapters: [adapter],
  router: createIdentityRouter({ routes: [{ channelId: adapter.id, agentId }, { agentId }] }),
  access: createAccessController({ policy: { kind: 'pairing' }, store: store.pairing }),
  onUnauthorized: async (_msg, decision, io) => { /* deliver the pairing code */ },
  onMessage: async (ctx) => {
    const result = await agent.run(ctx.sanitizedText, {
      sessionId,
      userId,
      inboundTaint: ctx.inboundTaint, // arms the run's data-flow ledger
    });
    return { text: result.output };
  },
});
```

The smoke test sends `"Ignore previous instructions. ..."` through the door - the sanitizer strips the injection phrase before the agent ever sees it.

---

## How the deterministic stub provider works

`./src/stub-provider.ts` ships one `Provider` that powers both agents. It dispatches on the role marker (`[role:assistant]` / `[role:heartbeat]`) embedded in each agent's instructions - the same convention as [`multi-agent-crew`](../multi-agent-crew/) - and derives every turn from the request messages alone (no cursor, no shared state), so the suspend/resume replay stays correct:

- **assistant, "daily summary" task** - 0 tool messages -> call `add_reminder`; 1 -> call the gated `send_daily_summary` (the run parks here); 2+ -> final text quoting the receipt.
- **assistant, anything else** - answer from the first `<fact>` in the assembled system prompt, or admit the gap.
- **heartbeat** - a checklist mentioning `overdue` yields a finding; otherwise the `HEARTBEAT_OK` sentinel.

Zero sockets, zero child processes, zero disk I/O.

---

## CLI demo behaviour

```bash
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/assistant-bot dev
```

Set `GRAPHORIN_USER_ID=...` to override the session `userId` and `GRAPHORIN_DB_PATH=...` to persist to a file instead of `:memory:`. The recipe enumeration only ships `'stub'` today; `GRAPHORIN_LLM_RECIPE=anything-else` raises `TypeError`. Swap in any real `Provider` (Ollama, llama.cpp, Anthropic, ...) by passing `providerOverride` to `createAssistantBotApp(...)`.

If `GRAPHORIN_ASSISTANT_BOT_PEPPER` is unset the demo installs a documented demo pepper; production deployments must set their own (see `@graphorin/security` pepper strength rules).

### What's deliberately out

- **Vendor channel adapters** - the loopback testkit adapter stands in; see [`slack-bot-integration`](../slack-bot-integration/) for a real transport.
- **Vector recall** - `skipSqliteVec: true` keeps the example free of native extensions; recall rides FTS5. See [`memory-graph-recall`](../memory-graph-recall/) for embeddings + graph hops.
- **The consolidator daemon** - background memory consolidation has its own example: [`background-consolidator`](../background-consolidator/).
- **Durable workflows** - the step-journal / timers / awakeables surface is covered by [`approval-workflow`](../approval-workflow/).

---

## Troubleshooting

- **`Module '"@graphorin/..."' has no exported member ...`** - run `pnpm install` at the workspace root; the example consumes the workspace-linked packages.
- **The REST run returns 401** - the bearer token and the server pepper must come from the same process: `createAssistantBotApp` mints the token after `ensurePepper()` installs `GRAPHORIN_ASSISTANT_BOT_PEPPER`. If you set the env var yourself, set it before boot.
- **The front-door reply never arrives** - the gateway drains its queue asynchronously; poll `adapter.deliveries` (the demo helpers and the smoke test use `waitFor` / `vi.waitFor`, never fixed sleeps).
- **Recall answers "I do not have that in memory yet"** - the question must share tokens with the stored fact for the FTS leg (`skipSqliteVec` disables the vector leg). Re-use the exported `RECALL_QUESTION`, or wire an embedder for semantic matches.
- **`heartbeat.beat()` returns `{ skipped: 'empty-checklist' }`** - that is the cost model working: no pending reminders means no model call. Add a reminder first.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.11 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
