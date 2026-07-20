[**Graphorin API reference v0.13.3**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / TICKET\_SUBPROTOCOL\_PREFIX

# Variable: TICKET\_SUBPROTOCOL\_PREFIX

```ts
const TICKET_SUBPROTOCOL_PREFIX: "ticket." = 'ticket.';
```

Defined in: src/subprotocol.ts:42

**`Stable`**

Prefix for the single-use ticket that browser clients attach to
the `Sec-WebSocket-Protocol` header. The server's upgrade handler
splits the comma-separated list, finds the first
`ticket.<value>` token, and validates the value against the
in-memory ticket store before granting the connection.
