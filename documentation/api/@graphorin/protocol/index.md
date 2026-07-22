[**Graphorin API reference v0.14.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/protocol

# @graphorin/protocol

> Wire-format contract for the [Graphorin](https://github.com/o-stepper/graphorin) framework's WebSocket subprotocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/o-stepper/graphorin/blob/main/LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-43853d.svg)](https://nodejs.org)

- **Version:** v0.14.0
- **License:** [MIT](https://github.com/o-stepper/graphorin/blob/main/LICENSE) (© 2026 Oleksiy Stepurenko)
- **Repository:** <https://github.com/o-stepper/graphorin/tree/main/packages/protocol>
- **Issues:** <https://github.com/o-stepper/graphorin/issues>

`@graphorin/protocol` is the single source of truth for the shape of every frame exchanged over `wss://.../v1/ws`. Both [`@graphorin/server`](/api/@graphorin/server/index.md) and [`@graphorin/client`](/api/@graphorin/client/index.md) import their schemas from this package so the two implementations cannot drift.

## What ships in v0.1 (Phase 14b)

| Surface | Detail |
|---|---|
| **Subprotocol** | `graphorin.protocol.v1` (`SUBPROTOCOL_NAME`). Browser clients attach a single-use ticket as a second `Sec-WebSocket-Protocol` token via `formatTicketSubprotocol(ticket)` ⇒ `'ticket.<value>'`. |
| **Client → Server frames** | Discriminated union `ClientMessage` covering `initialize`, `subscription.subscribe`, `subscription.unsubscribe`, `run.cancel`, `ping`, and the MCP-compatible `notifications/cancelled` notification. |
| **Server → Client frames** | Discriminated union `ServerMessage` covering JSON-RPC responses (`result` / `error`), typed push events (`{ kind: 'event', subject, type, payload, eventId }`), lifecycle frames, async error frames, `pong`, `subscribed` / `unsubscribed`, and `replay-marker`. |
| **Close codes** | Application-private 4xxx range per RFC 6455 § 7.4: `4001 auth.required`, `4002 auth.invalid`, `4003 auth.revoked`, `4004 auth.scope_denied`, `4005 rate.limited`, `4006 flow.throttled`, `4007 server.shutdown`, `4008 protocol.violation`. |
| **Bundle** | Browser-friendly. Zero Node-only dependencies; the only runtime dependency is `zod`. |

## Direct dependencies

- [`zod`](https://zod.dev) (`^3.25.0`) - runtime schema validation. The MIT-licensed Zod project supplies the discriminated union, strict-object, and `safeParse` primitives that back every `*Schema` export. No other runtime dependency exists; the package is otherwise pure TypeScript.

## Install

```bash
pnpm add @graphorin/protocol zod
```

> Other npm-registry-compatible package managers (`npm`, `yarn`, `bun`) work identically.

## Usage

```ts
import {
  ClientMessageSchema,
  ServerMessageSchema,
  SUBPROTOCOL_NAME,
  formatTicketSubprotocol,
  isEventFrame,
} from '@graphorin/protocol';

// 1. Validate an inbound client frame on the server.
const parsed = ClientMessageSchema.safeParse(JSON.parse(rawFrame));
if (!parsed.success) {
  ws.close(4008, 'protocol.violation');
  return;
}

// 2. Build the subprotocol header for a browser client.
ws.subprotocol = `${SUBPROTOCOL_NAME}, ${formatTicketSubprotocol(ticket)}`;

// 3. Narrow a server frame on the client.
const incoming = ServerMessageSchema.parse(JSON.parse(rawFrame));
if (isEventFrame(incoming)) {
  console.log(incoming.subject, incoming.type, incoming.payload);
}
```

## License

MIT © 2026 Oleksiy Stepurenko. See [`LICENSE`](https://github.com/o-stepper/graphorin/blob/main/LICENSE).

---

**Project Graphorin** · v0.14.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/protocol/README.md) | `@graphorin/protocol` - wire-format contract for the Graphorin WebSocket subprotocol. |
| [client-message](/api/@graphorin/protocol/client-message/index.md) | `ClientMessage` - discriminated union of every frame a Graphorin WebSocket client may send to the server. The wire is hybrid: the control plane uses JSON-RPC-shaped requests / notifications; the data plane uses typed push events emitted exclusively by the server (see `./server-message.ts`). |
| [close-codes](/api/@graphorin/protocol/close-codes/index.md) | Custom WebSocket close-code taxonomy used by `@graphorin/server` and `@graphorin/client`. The numeric values live in the 4xxx application-private range per RFC 6455 § 7.4. |
| [package.json](/api/@graphorin/protocol/package.json/index.md) | - |
| [server-message](/api/@graphorin/protocol/server-message/index.md) | `ServerMessage` - discriminated union of every frame a Graphorin server may push to a client. Three families share the channel: |
| [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) | Subprotocol identifier + negotiation helpers for the Graphorin WebSocket protocol. |
