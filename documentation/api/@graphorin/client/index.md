[**Graphorin API reference v0.12.1**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/client

# @graphorin/client

> Reference TypeScript client for the [Graphorin](https://github.com/o-stepper/graphorin) standalone server.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/o-stepper/graphorin/blob/main/LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-43853d.svg)](https://nodejs.org)

- **Version:** v0.12.1
- **License:** [MIT](https://github.com/o-stepper/graphorin/blob/main/LICENSE) (© 2026 Oleksiy Stepurenko)
- **Repository:** <https://github.com/o-stepper/graphorin/tree/main/packages/client>
- **Issues:** <https://github.com/o-stepper/graphorin/issues>

`@graphorin/client` is the reference TypeScript client for the Graphorin standalone server. It wraps the WebSocket subprotocol `graphorin.protocol.v1` (with an optional Server-Sent Events fallback for proxy-restricted environments) behind an ergonomic `GraphorinClient` class.

## What ships in v0.1 (Phase 14b)

| Capability | Detail |
|---|---|
| **WebSocket transport** | Honours the `graphorin.protocol.v1` subprotocol; supports both bearer-token (Node SDK) and ticket-flow (browser) authentication. |
| **SSE fallback** | Read-only fetch-streaming SSE transport (not `EventSource`) for environments that block WebSocket upgrades. It carries only the bound session stream, so it needs the `sessionId` client option and bearer auth; control-plane operations (`subscribe`, `cancel`, `resume`) fall back to REST. |
| **Async-iterable subscriptions** | `for await (const event of sub.events())` - typed `AgentEvent` / `WorkflowEvent` payload via `@graphorin/protocol`. |
| **Reconnect** | Exponential backoff with full jitter; resubscribes with the recorded `lastEventId` so the server replays buffered events. |
| **Bundle hygiene** | Browser-friendly. Zero Node-only dependencies; runtime depends only on `@graphorin/protocol` and `zod`. |

## Direct dependencies

- [`@graphorin/protocol`](/api/@graphorin/protocol/index.md) - single source of truth for the wire format.
- [`zod`](https://zod.dev) (`^3.25.0`) - schema validation re-exported transitively through `@graphorin/protocol`.

## Install

```bash
pnpm add @graphorin/client @graphorin/protocol zod
```

> Other npm-registry-compatible package managers (`npm`, `yarn`, `bun`) work identically.

## Usage

```ts
import { GraphorinClient } from '@graphorin/client';

const client = new GraphorinClient({
  baseUrl: 'wss://graphorin.example.com',
  auth: { kind: 'bearer', token: process.env.GRAPHORIN_TOKEN ?? '' },
  transport: 'auto', // try WebSocket first, fall back to SSE
});

await client.connect();

const subscription = await client.subscribe({
  target: 'agent',
  id: 'echo',
  runId: 'run-123',
});

for await (const event of subscription.events()) {
  console.log(event.type, event.payload);
}

await client.cancel('run-123', { drain: false });
await client.disconnect();
```

### Browser ticket flow

```ts
const client = new GraphorinClient({
  baseUrl: 'https://graphorin.example.com',
  auth: {
    kind: 'ticket',
    ticketProvider: async () => {
      const res = await fetch('/v1/session/ws-ticket', {
        method: 'POST',
        headers: { Authorization: `Bearer ${browserToken}` },
      });
      const body = (await res.json()) as { ticket: string };
      return body.ticket;
    },
  },
});
```

The client attaches the ticket as a second `Sec-WebSocket-Protocol` token (`ticket.<value>`), per the wire contract documented in [`@graphorin/protocol`](/api/@graphorin/protocol/index.md).

## License

MIT © 2026 Oleksiy Stepurenko. See [`LICENSE`](https://github.com/o-stepper/graphorin/blob/main/LICENSE).

---

**Project Graphorin** · v0.12.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/client/README.md) | `@graphorin/client` - reference TypeScript client for the Graphorin standalone server. |
| [client](/api/@graphorin/client/client/index.md) | - |
| [errors](/api/@graphorin/client/errors/index.md) | Typed error hierarchy surfaced by `@graphorin/client`. Every error class extends the JavaScript built-in `Error` and exposes a stable `kind` discriminator so consumers can pattern-match without relying on `instanceof` (which behaves badly across module-system boundaries when the package is dual-loaded). |
| [package.json](/api/@graphorin/client/package.json/index.md) | - |
| [reconnect](/api/@graphorin/client/reconnect/index.md) | Pure-functional reconnect-backoff helper. Encapsulated in its own module so the `GraphorinClient` stays free of timing heuristics - and so tests can drive the policy with a deterministic RNG. |
| [transport](/api/@graphorin/client/transport/index.md) | Transport barrel for `@graphorin/client`. |
