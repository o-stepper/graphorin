[**Graphorin API reference v0.13.9**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/sessions

# @graphorin/sessions

> Hybrid facade-with-state session module for the Graphorin framework.

`@graphorin/sessions` is the session-lifecycle and multi-agent
attribution layer of the Graphorin framework. It owns sessions
metadata, the `AgentRegistry`, handoff records, workflow-run
attachments, the JSONL session export contract, the tool cassette
contract, the sanitized-by-default replay surface, and the
session-output-boundary commentary sanitizer.

The package is a **hybrid facade**: it owns sessions / agents /
handoffs / workflow-attachments / audit metadata, but it **does not
duplicate message storage** - `Session.push / list / search / compact`
are 1-line wrappers for `@graphorin/memory.session` (single source
of truth).

## Dependencies

- `@graphorin/core` - typed contracts (`SessionStore`, `Message`,
  `MessageContent`, `HandoffRecord`, `Tracer`, `Sensitivity`, …).
- `@graphorin/memory` - owns the `session_messages` table and the
  `Memory.session` CRUD surface; `Session.push / list / search /
  compact` delegate to it.
- `@graphorin/observability` - supplies the `createReplay(...)`
  primitive used to walk the trace log for `Session.replay(...)`.
- `@graphorin/security` - supplies the audit-chain helper used to
  emit one entry per replay invocation, per cassette write, per
  cassette substitution, and per commentary-phase sanitization
  decision.

Storage is supplied by any `SessionStore` implementation (the
default production adapter is `@graphorin/store-sqlite`).

## Highlights

- **Hybrid facade.** `Session.push / list / search / compact` route
  every message-shaped call to `@graphorin/memory.session` exactly
  once. The package does not declare its own `session_messages`
  table or FTS5 index.
- **`AgentRegistry`.** A singleton-per-session-manager registry that
  records every agent that ever produced a message in a session.
  Retire / delete / placeholder semantics keep replay working even
  after agents are renamed or removed.
- **Multi-agent first-class.** Per-message `agentId`, automatic
  handoff records, `Session.list({ agentId })` filtering,
  `handoffsByAgent(agentId, direction)`.
- **JSONL session export schema 1.0** -
  `graphorin-session-export/1.0`. Sentinel header + footer; record
  kinds `meta / session / agent / message / handoff / audit /
  footer`; N-2 backwards-compat; lenient-forward-parse for unknown
  record kinds; opt-in `--hash` (SHA-256 body checksum) / `--encrypt`
  (AES-256-GCM passphrase via `SecretValue`). Embedder-mismatch
  lossy-field rules drop embeddings on import (with WARN); reasoning
  content + Anthropic-shaped opaque `meta.signature` / `meta.data`
  round-trip bytes-equal.
- **Tool cassette schema 1.0** -
  `graphorin-tool-cassette/1.0`. Sibling JSONL format with the same
  N-2 / lenient-forward-parse / `--hash` / `--encrypt` discipline.
  Records carry per-tool `sideEffectClass` + optional
  `idempotencyKey` so `Session.replay({ cassette,
  toolReplayMode: 'auto' })` can substitute deterministic results
  for `'pure'` / `'read-only'` tools, re-execute live for
  `'side-effecting'` / `'external-stateful'` tools (with non-
  silenceable WARN on the latter), and surface idempotency-mismatch
  / schema-mismatch / artifact-missing decisions forensically.
- **Sanitized-by-default replay.** `Session.replay({ raw: false })`
  walks the trace log via `@graphorin/observability.createReplay`,
  drops `secret`-tagged content, and writes one audit entry per
  invocation. Raw access requires the `traces:read:raw` scope.
- **Commentary-phase sanitization** at four session-output
  boundaries (`push / list / export / replay`). Internal tool-call
  trace fragments leaking into user-visible text get wrapped in a
  `<<<commentary>>>` envelope (default), stripped entirely
  (operator opt-in), or passed through (operator opt-in). The
  `causalityChain: string[]` field on `MessageContent` parts
  round-trips bytes-equal through `Session.push / list / export /
  import`.

## Quick start

```ts
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createSessionManager } from '@graphorin/sessions';

const store = await createSqliteStore({ path: './assistant.db' });
await store.init();

const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
});

const sessions = createSessionManager({
  store: store.sessions,
  memory,
});

const session = await sessions.create({
  userId: 'user-123',
  agentId: 'main',
  sessionId: 'sess-1',
});

await session.push({ role: 'user', content: 'Hi!' });
const recent = await session.list({ lastN: 10 });
```

## License

MIT - © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.13.9 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/sessions/README.md) | `@graphorin/sessions` - hybrid facade-with-state session module for the Graphorin framework. |
| [agent-registry](/api/@graphorin/sessions/agent-registry/index.md) | `AgentRegistry` - the per-session-manager catalogue of every agent that has ever produced a message in a session. The registry exists to keep replay working long after the agent has been renamed or deleted: orphan `agent_id` references on stored messages can always be resolved via `resolveOrPlaceholder(...)`. |
| [cassette](/api/@graphorin/sessions/cassette/index.md) | Barrel for the tool-cassette schema 1.0 surface. |
| [commentary](/api/@graphorin/sessions/commentary/index.md) | Commentary-phase trace sanitization barrel for `@graphorin/sessions`. |
| [errors](/api/@graphorin/sessions/errors/index.md) | Typed error surface for `@graphorin/sessions`. |
| [export](/api/@graphorin/sessions/export/index.md) | Barrel for the JSONL session-export schema 1.0 surface. |
| [facade](/api/@graphorin/sessions/facade/index.md) | - |
| [migrations](/api/@graphorin/sessions/migrations/index.md) | Migration registry for the JSONL session-export schema. v0.1 ships MAJOR `1` only; the registry exists so future MAJOR bumps can plug a migrator in without forking this package. |
| [package.json](/api/@graphorin/sessions/package.json/index.md) | - |
| [replay](/api/@graphorin/sessions/replay/index.md) | Barrel for the session-level replay surface. |
