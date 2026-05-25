---
title: Sessions
description: A hybrid session facade with multi-agent attribution, agent registry, handoff records, JSONL export schema 1.0, and replay reconstruction.
---

# Sessions

`@graphorin/sessions` is the hybrid session facade for the framework. It owns multi-agent attribution, the agent registry, handoff records, the JSONL export schema, and the replay reconstruction primitives.

## What a session is

A **session** is the unit of conversation that survives across turns, agent steps, and (when persisted) process restarts. Every session carries:

- a stable `sessionId` and `userId`;
- the rolling list of messages (owned by `@graphorin/memory`'s session tier);
- the agent registry — every agent that participated, with metadata;
- handoff records — the typed log of when control passed between agents;
- per-agent attribution on every message;
- the optional JSONL export — a byte-equal replay of the entire session.

## The hybrid facade

```ts
import { createSessionManager } from '@graphorin/sessions';

const manager = createSessionManager({
  store: sqlite.sessions,
  memory: memory.session, // or any SessionMemoryFacade
});

// New session.
const session = await manager.create({
  userId: 'alex',
  agentId: 'planner',
  title: 'Saturday hike planning',
});

// Existing session.
const reopened = await manager.get(session.id);

await session.push({
  role: 'user',
  content: 'Help me plan a hike for Saturday.',
});
```

## Agent registry

Every agent that participates in any session registers once on the manager-level registry:

```ts
manager.agents.register({
  id: 'planner',
  name: 'Trip planner',
  description: 'Plans hikes, trips, and itineraries.',
  tags: ['travel'],
});

const planner = manager.agents.resolveOrPlaceholder('planner');
```

The registry exposes `register`, `retire`, `delete`, `resolveOrPlaceholder` for the multi-agent lifecycle.

## Multi-agent attribution

Every session message persisted by the agent runtime can carry an optional `agentId`. Filter per-agent on read:

```ts
const plannerTurns = await session.list({ agentId: 'planner' });
```

## Handoff records

When `Agent A` hands off to `Agent B`, the session records:

- the `from` and `to` agent ids;
- the active handoff input filter (e.g. `lastN(10)`);
- the timestamp;
- the truncated message snapshot the receiver sees;
- the resolved sub-agent secrets inheritance posture.

```ts
const all = await session.listHandoffs();
const incoming = await session.handoffsByAgent('planner', 'incoming');
```

The `lastN(10)` default plus the filter library from `@graphorin/agent` mean the boundary payload is **always** explicit.

## JSONL export schema 1.0

`session.export({ schema: '1.0', writer })` writes a deterministic JSONL stream conforming to **schema 1.0** (`graphorin-session-export/1.0`). Each line is a typed record:

| Record kind | When emitted |
|---|---|
| `session-open` | Once at the start. |
| `agent-registered` | When `agents.register(...)` is called. |
| `message` | Every user / assistant / system message. |
| `tool-call` | Every tool invocation. |
| `tool-result` | Every tool result. |
| `handoff` | Every handoff between agents. |
| `compaction` | Every auto-compaction by the context engine. |
| `progress-write` | Every `agent.progress.write(...)` artifact. |
| `session-close` | Once at the end (when explicitly closed). |

The schema is byte-stable — replays always produce the same payload byte-for-byte for the same input.

## Replay

```ts
const replayed = await session.replay({
  toolReplayMode: 'auto', // 'auto' | 'live' | 'recorded' | 'mixed'
});
```

By default, replays are **sanitised** — sensitive content is redacted, and external side-effects (real provider calls, real tool executions with side-effects) are stubbed against recorded "tool cassettes" (`graphorin-tool-cassette/1.0`). The `toolReplayMode` knob honours per-tool `sideEffectClass` so `'pure'` and `'read-only'` tools may be re-executed live while `'side-effecting'` and `'external-stateful'` tools default to the recorded cassette.

Every replay writes one audit row.

## Tool cassettes

`session.recordToolCassette({...})` writes a deterministic JSONL companion file alongside an export: every tool call's input, output, and timing is captured under the `graphorin-tool-cassette/1.0` schema so replays can reproduce a run byte-equal even when the underlying tools mutate the world.

## Session messages: who owns them

`@graphorin/memory.session.*` is the **single source of truth** for session messages. The `@graphorin/sessions` facade is a typed view over that storage that adds the multi-agent surface (registry, handoffs, attribution, JSONL, replays). There is no duplicate message log to keep in sync.

## Composition with the standalone server

The standalone server (`@graphorin/server`) exposes the session surface under `/v1/sessions/...`. See [Standalone server](/guide/standalone-server) for the full REST table.

The CLI command `graphorin migrate-export <path>` produces a JSONL export from the local SQLite database.

## Next steps

- [Memory system](/guide/memory-system) — session tier surface.
- [Agent runtime](/guide/agent-runtime) — handoffs, filters, attribution.
- [Standalone server](/guide/standalone-server) — REST endpoints.
- [CLI](/guide/cli) — `graphorin migrate-export`.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
