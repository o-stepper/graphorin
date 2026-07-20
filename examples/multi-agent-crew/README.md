# multi-agent-crew

> A supervisor + 2 workers acceptance demo for **graphorin** - wires `createAgent({ handoffs: [...] })` so the agent runtime auto-generates `transfer_to_<worker>` tools, emits a `HandoffRecord` per transfer, and lets one shared `SessionManager` reconstruct the full multi-agent conversation from JSONL export → `session.list({ agentId })` → `session.replay({ ... })`.

The example is small (≈300 lines of source, three files) but it exercises **every** RB-33 acceptance criterion against a deterministic in-tree stub provider so CI never depends on a live LLM.

---

## First 5 minutes

If you only want to see the crew run end-to-end:

```bash
pnpm install
pnpm --filter ./examples/multi-agent-crew build
pnpm --filter ./examples/multi-agent-crew test
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/multi-agent-crew dev
```

Expected dev output:

```
graphorin v0.13.6 multi-agent-crew - recipe='stub', handoffs=2, messages=4, agents=3, output='Crew synthesis - researcher said: "[researched] Key findings about 'Summarise the design consid…'.
```

**What just happened?**

1. The supervisor agent received a task.
2. It called `transfer_to_worker-a` → the **researcher** synthesised a snippet.
3. It called `transfer_to_worker-b` → the **writer** turned the snippet into a polished paragraph.
4. The supervisor stitched both worker outputs into a final synthesis.
5. The session captured per-agent attribution + 2 handoff records + 3 agent registry entries; the JSONL export round-trips the whole thing.

That is the full crew pattern. The advanced section below walks through each RB-33 acceptance scenario.

---

## Quick map of the source

```
examples/multi-agent-crew/
├── src/
│   ├── main.ts              # runCrew(...) + per-role factories + CLI demo
│   ├── stub-provider.ts     # Deterministic per-role stub Provider (no network)
│   └── secret-stub.ts       # In-tree SecretValue stub (DEC-137 demonstration)
├── tests/
│   └── smoke.test.ts        # 7 vitest cases covering all six RB-33 criteria
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## Advanced - the supervisor + workers pattern

Every agent is a plain `createAgent({...})` call. The supervisor names the workers in its `handoffs: [...]` array, which makes the agent runtime auto-generate `transfer_to_worker-a` / `transfer_to_worker-b` virtual tools and append a `HandoffRecord` whenever the model invokes one.

### Researcher (`worker-a`)

```ts
export function createResearcher(options: RoleFactoryOptions): Agent<CrewDeps, string> {
  return createAgent<CrewDeps, string>({
    name: WORKER_NAMES.researcher,
    instructions:
      `${ROLE_MARKERS.researcher} You are the Researcher worker. ` +
      'Synthesise the supervisor request into a concise research snippet ' +
      'enumerating prior art, open questions, and recommended sources.',
    provider: options.provider,
    tools: [buildReadSecretTool()],
  });
}
```

### Writer (`worker-b`)

```ts
export function createWriter(options: RoleFactoryOptions): Agent<CrewDeps, string> {
  return createAgent<CrewDeps, string>({
    name: WORKER_NAMES.writer,
    instructions:
      `${ROLE_MARKERS.writer} You are the Writer worker. ` +
      "Read the most recent tool message (the researcher's output) and " +
      'rewrite it as a polished paragraph the operator can ship.',
    provider: options.provider,
    tools: [buildReadSecretTool()],
  });
}
```

### Supervisor

The supervisor wires the workers via `handoffs: [...]` and pins the explicit `compose(lastN(10), stripReasoning())` filter so the resulting `HandoffRecord.inputFilter` descriptor is byte-stable across runs.

```ts
const handoffFilter = filters.compose(filters.lastN(10), filters.stripReasoning());

createAgent<CrewDeps, string>({
  name: 'supervisor',
  instructions: `${ROLE_MARKERS.supervisor} You are the Supervisor. ...`,
  provider,
  tools: [buildReadSecretTool()],
  handoffs: [
    { target: researcher, inputFilter: handoffFilter },
    { target: writer, inputFilter: handoffFilter },
  ],
  deps: { secret }, // mounted via runContext.deps for tools defined on this agent
});
```

---

## RB-33 acceptance scenarios

### 1. JSONL export carries `kind: 'agent'` AND `kind: 'handoff'`

`session.export({ sink })` streams a `graphorin-session-export/1.0` JSONL document. The body emits one `kind: 'agent'` record per registered agent and one `kind: 'handoff'` record per supervisor → worker transfer:

```ts
const { footer, body } = await exportSessionJsonl(handle.session);
// footer.agentCount    → 3 (supervisor, worker-a, worker-b)
// footer.handoffCount  → 2 (supervisor → worker-a, supervisor → worker-b)
const parsed = readSessionExport(body, {});
const agentRecords   = parsed.records.filter((r) => r.kind === 'agent');
const handoffRecords = parsed.records.filter((r) => r.kind === 'handoff');
```

### 2. Per-agent attribution via `session.list({ agentId })`

Every assistant message we push into the session carries an explicit `agentId`. `session.list({ agentId: 'worker-a' })` filters at the SQL layer:

```ts
const onlyResearcher = await session.list({ agentId: WORKER_NAMES.researcher });
// → only the researcher's assistant messages.
//   No supervisor turns, no writer turns, no user / tool rows.
```

### 3. Replay reconstructs the registry with placeholder support

`AgentRegistry.delete(agentId)` hard-deletes the row. `resolveOrPlaceholder(...)` then returns `{ kind: 'unknown', id }` so callers can render a placeholder like `"<deleted:worker-b>"` while replay still iterates to completion:

```ts
await sessionManager.agents.delete(WORKER_NAMES.writer);

const placeholder = await describeAgentForReplay(sessionManager.agents, WORKER_NAMES.writer);
// → '<deleted:worker-b>'

for await (const ev of session.replay()) {
  // → 'replay.start' ... 'replay.end' (no traceSource = empty body, but the engine still runs cleanly)
}
```

### 4. Auto-handoff records on `transfer_to_<worker>` invocation

The agent runtime auto-emits a `handoff` event AND appends a `HandoffRecord` to `RunState.handoffs` whenever the model calls one of the auto-generated transfer tools. The example also persists each `HandoffRecord` to the session via `session.appendHandoff(...)` so it shows up in JSONL export. Two handoffs land per crew run.

### 5. Sub-agent secrets isolation (DEC-137)

The supervisor mounts a `SecretValue` on its `deps`; workers inherit no secret refs (the recorded `HandoffRecord.inheritedSecrets` allowlist is empty) and ship `deps: undefined` - so a worker tool reading `ctx.runContext.deps?.secret` always sees `undefined`:

```ts
expect(handle.supervisor.config.deps?.secret).toBeDefined();      // ← supervisor has it
expect(handle.workers.researcher.config.deps).toBeUndefined();    // ← worker does not
expect(handle.workers.writer.config.deps).toBeUndefined();        // ← neither does the writer

const tool = buildReadSecretTool();
await tool.execute({}, makeCtxWith(handle.supervisor.config.deps)); // → 'secret-len=N'
await tool.execute({}, makeCtxWith(undefined));                     // → '<no-secret>'
```

The `SecretValue` wrapper itself redacts every standard JS coercion path:

```ts
String(secret)                       // → '[SECRET]'
JSON.stringify({ apiKey: secret })   // → '{"apiKey":"[SECRET]"}'
util.inspect(secret)                 // → 'SecretValue([REDACTED])'
await secret.use((raw) => raw)       // → returns the raw string inside a scoped callback
```

To explicitly opt INTO secret forwarding, declare the keys via `Agent.toTool({ secretsInheritance: 'inherit-allowlist', inheritSecrets: ['MY_KEY'] })` on the parent.

### 6. Handoff `inputFilter` defaults - `lastN(10) + stripReasoning` (DEC-146 / RB-40)

`filters.compose(...)` always appends `stripReasoning()` so reasoning content can never cross a handoff boundary, regardless of caller intent. The example's explicit filter is `compose(lastN(10), stripReasoning())`; the resulting `HandoffRecord.inputFilter` descriptor surfaces the composition stack:

```ts
const first = handle.handoffs[0];
// first.inputFilter.kind          → 'compose'
// first.inputFilter.meta.steps    → [
//   { kind: 'last-n', meta: { n: 10 } },
//   { kind: 'strip-reasoning' },
//   { kind: 'strip-reasoning' },         // compose(...) auto-appends
// ]
```

To override the default, pass a custom filter on the handoff target:

```ts
handoffs: [
  {
    target: researcher,
    inputFilter: filters.compose(filters.summary('boil it down'), filters.stripReasoning()),
  },
]
```

---

## How the deterministic stub provider works

`./src/stub-provider.ts` ships a single `Provider` that powers all three roles. It dispatches on the role marker (`[role:supervisor]` / `[role:researcher]` / `[role:writer]`) embedded in the agent's `instructions` system prompt - exactly the same convention as the [`three-agent-harness`](../three-agent-harness/) example.

The supervisor stub is stateful per call: it counts the tool messages already in `req.messages` and decides:

- **Step 1** (zero tool messages) → emit a `tool-call-end` for `transfer_to_worker-a`.
- **Step 2** (one tool message) → emit a `tool-call-end` for `transfer_to_worker-b`.
- **Step 3** (two tool messages) → emit a `text-delta` joining both worker outputs.

The workers each emit a single `text-delta` followed by a `finish` event. Zero sockets, zero child processes, zero disk I/O.

---

## CLI demo behaviour

```bash
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/multi-agent-crew dev
GRAPHORIN_CREW_TASK='Plan a marketing rollout' pnpm --filter ./examples/multi-agent-crew dev
```

Set `GRAPHORIN_USER_ID=...` to override the session `userId`. The recipe enumeration only ships `'stub'` today; `GRAPHORIN_LLM_RECIPE=anything-else` raises `TypeError`.

---

## Troubleshooting

- **`Module '"@graphorin/agent"' has no exported member ...`** - ensure you ran `pnpm install` at the workspace root; the example consumes the workspace-linked packages.
- **Replay "completes" with only `replay.start` + `replay.end`** - that's the lib-mode default. `Session.replay({ traceSource })` accepts an `AsyncIterable<SpanRecord>` from `@graphorin/observability/exporters` if you want to hydrate against a real trace log.
- **`session.list({ agentId })` returns nothing** - only assistant messages carry `agentId`; user / system / tool rows are filtered out by the SQL store. Check that `runCrew(...)` ran to completion AND that you used the registered worker name (`worker-a` / `worker-b`).

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.6 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
