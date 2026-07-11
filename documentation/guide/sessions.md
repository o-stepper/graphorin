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
- the agent registry - every agent that participated, with metadata;
- handoff records - the typed log of when control passed between agents;
- per-agent attribution on every message;
- the optional JSONL export - a byte-equal replay of the entire session.

## The hybrid facade

```ts file=session-setup.ts
import { createMemory } from '@graphorin/memory';
import { createSessionManager } from '@graphorin/sessions';
import { createSqliteStore } from '@graphorin/store-sqlite';

const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();
const memory = createMemory({ store: sqlite.memory, embeddings: sqlite.embeddings });

export const manager = createSessionManager({
  store: sqlite.sessions,
  memory: memory.session, // or any SessionMemoryFacade
});

// New session.
export const session = await manager.create({
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
import { manager } from './session-setup.js';

await manager.agents.register('planner', {
  displayName: 'Trip planner',
  tags: ['travel'],
});

const planner = await manager.agents.resolveOrPlaceholder('planner');
```

The registry exposes `register`, `retire`, `delete`, `resolveOrPlaceholder` for the multi-agent lifecycle.

## Multi-agent attribution

Every session message pushed through `session.push(...)` can carry an optional `agentId` (the agent runtime does not auto-persist turns - your loop owns the pushes). Filter per-agent on read:

```ts
import { session } from './session-setup.js';

const plannerTurns = await session.list({ agentId: 'planner' });
```

## Handoff records

When `Agent A` hands off to `Agent B`, the session records:

- the `from` and `to` agent ids;
- the active handoff input filter as a serializable descriptor (e.g. `lastN(10)`) - no message snapshot is duplicated onto the record;
- the step number and timestamp;
- the resolved sub-agent secrets inheritance posture (the policy plus the inherited key names - never the values).

```ts
import { session } from './session-setup.js';

const all = await session.listHandoffs();
const incoming = await session.handoffsByAgent('planner', 'to');
```

The default filter (`lastN(10)` composed with `stripSensitiveOutputs()`) plus the filter library from `@graphorin/agent` mean the boundary payload is **always** explicit.

## JSONL export schema 1.0

`session.export({ schema: '1.0', sink })` writes a deterministic JSONL stream conforming to **schema 1.0** (`graphorin-session-export/1.0`) into the supplied `SessionExportSink`; the optional `writer` string is a label stamped on the meta header. Each line is a typed record:

| Record kind | When emitted |
|---|---|
| `meta` | Once at the start (schema id, writer label, minimum runtime version, active embedder ids). |
| `session` | The exported session's descriptor. |
| `agent` | One per agent the session references (its primary agent, message authors, handoff participants). |
| `message` | Every user / assistant / system message. |
| `handoff` | Every handoff between agents. |
| `audit` | Audit entries included in the export. |
| `footer` | Once at the end (record counts, optional hash / cipher stamps). |

Tool calls and results travel in the separate **tool cassette** stream (schema `graphorin-tool-cassette/1.0`), not in the session export. The serialization is deterministic - the same input produces the same body records byte-for-byte; only the meta header and footer carry wall-clock timestamps (from the manager's injectable clock).

### Encryption (opt-in)

Encryption lives on the low-level export writer (`session.export` does not
forward an `encrypt` option today). Pass `encrypt` to
`createSessionExportWriter` to AES-256-GCM the body. Each body record is
encrypted independently and emitted as a self-identifying `{"enc":"…"}` line;
the meta header and footer stay plaintext so an importer can fail fast, and the
footer stamps `cipher: "aes256gcm"`. Supply either a pre-derived 32-byte `key`
or a `passphrase` + `salt` (derived via `deriveSessionExportKey`).

```ts
import { randomBytes } from 'node:crypto';
import { createBufferSink, createSessionExportWriter, deriveSessionExportKey } from '@graphorin/sessions/export';

const { sink } = createBufferSink(); // or any streaming SessionExportSink
const salt = randomBytes(16); // persist it: the importer re-derives with the same salt
const key = await deriveSessionExportKey('a-high-entropy-passphrase', salt);
const writer = createSessionExportWriter(sink, { writer: 'my-app@1.0.0', encrypt: { key } });
// Import: readSessionExport(body, { decryptionKey: key }).
// Without the key, the reader throws SessionExportEncryptionRequiredError.
```

The same `salt` must be supplied to the importer to re-derive the key. A
non-encrypted export never stamps `cipher`.

### Integrity

Independently of encryption, the footer records `recordCount` / `messageCount` /
`handoffCount` / `agentCount`, and the reader cross-checks them against the
records it actually parsed - a truncated or tampered body surfaces a
`footer-count-mismatch` warning. Pass `hash: true` to additionally stamp a
SHA-256 `checksum` of the body on the footer; the importer then verifies it and
throws `SessionExportChecksumMismatchError` on any mismatch.

## Replay

```ts
import { session } from './session-setup.js';

for await (const event of session.replay({
  toolReplayMode: 'auto', // 'auto' | 'live' | 'recorded' | 'mixed'
})) {
  console.log(event);
}
```

`session.replay()` reads its spans from the `traceSource` you pass, or - when you construct the manager with `replayTraceSource: (id) => traceSourceForSession(store.connection, id)` (the durable span sink from `@graphorin/store-sqlite`, migration 024) - from the persisted spans for that session. With no source wired, replay falls back to the empty source and emits only `replay.start` / `replay.end`. See [Observability § Replay](/guide/observability#replay).

By default, replays are **sanitised** - sensitive content is redacted - and tool calls are decided against the recorded "tool cassettes" (`graphorin-tool-cassette/1.0`) per the `toolReplayMode` policy. The default `'auto'` policy honours per-tool `sideEffectClass`: `'pure'` and `'read-only'` calls are **substituted from the recorded cassette** (after idempotency and output-schema checks), while `'side-effecting'` and `'external-stateful'` calls surface a **live re-execution decision** for the runtime to act on - `'external-stateful'` with a non-silenceable warning. `'recorded'` forces substitution for every tool; `'live'` bypasses the cassette entirely; `'mixed'` follows per-tool overrides.

Every replay writes two audit rows: `session.replay.requested` and `session.replay.completed`.

## Tool cassettes

`session.recordToolCassette({...})` writes a deterministic JSONL companion file alongside an export: every tool call's input, output, and timing is captured under the `graphorin-tool-cassette/1.0` schema so replays can reproduce a run byte-equal even when the underlying tools mutate the world.

## Session messages: who owns them

`@graphorin/memory.session.*` is the **single source of truth** for session messages. The `@graphorin/sessions` facade is a typed view over that storage that adds the multi-agent surface (registry, handoffs, attribution, JSONL, replays). There is no duplicate message log to keep in sync.

## Deleting sessions

`sessions.deleteSession(id)` is a hard delete with a full cascade: the session row, its handoffs, workflow-run attachments and lifecycle audit rows, the conversation content (messages and episodes with their FTS/vector index rows), every session-scoped memory surface (facts, insights, rules, working blocks, consolidator state - the `SESSION_SCOPED_PURGES` registry in `@graphorin/store-sqlite` is the canonical list), the session's persisted spans, and the checkpoints of suspended runs linked to the session. `memory_history` values originating from the session are scrubbed to event skeletons. After the call the conversation is neither searchable nor resumable, and `session.replay()` has nothing to reconstruct - that is the point. `pruneSessions({ beforeEpochMs, closedOnly })` runs the same cascade as a retention sweep. Erasure does not reach into previously-taken backups - see [Erasure and retention](/guide/privacy#erasure-and-retention).

## Composition with the standalone server

The standalone server (`@graphorin/server`) exposes the session surface under `/v1/sessions/...`. See [Standalone server](/guide/standalone-server) for the full REST table.

The CLI command `graphorin migrate-export <input> --to <out>` migrates an existing session-export JSONL file to a target schema version (`--to-schema`); it never reads the SQLite database itself.

## Next steps

- [Memory system](/guide/memory-system) - session tier surface.
- [Agent runtime](/guide/agent-runtime) - handoffs, filters, attribution.
- [Standalone server](/guide/standalone-server) - REST endpoints.
- [CLI](/guide/cli) - `graphorin migrate-export`.

