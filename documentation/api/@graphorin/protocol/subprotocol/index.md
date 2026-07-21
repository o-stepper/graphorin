[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / subprotocol

# subprotocol

Subprotocol identifier + negotiation helpers for the Graphorin
WebSocket protocol.

Clients announce supported subprotocols in the
`Sec-WebSocket-Protocol` upgrade header. The server is expected to
pick exactly one and echo it back; mismatches abort the handshake
per RFC 6455 § 4. Browsers also accept additional comma-separated
tokens - Graphorin uses this slot to attach a single-use ticket
via the `ticket.<value>` form (the WebSocket browser API does not
accept arbitrary headers, so the ticket has to ride the
subprotocol channel).

## Variables

| Variable | Description |
| ------ | ------ |
| [PROTOCOL\_VERSION](/api/@graphorin/protocol/subprotocol/variables/PROTOCOL_VERSION.md) | Wire-format major version literal carried on every message body. The pair `(SUBPROTOCOL_NAME, PROTOCOL_VERSION)` is the binding contract a client commits to when it receives a successful upgrade. |
| [SUBPROTOCOL\_NAME](/api/@graphorin/protocol/subprotocol/variables/SUBPROTOCOL_NAME.md) | Canonical subprotocol identifier for the v1 wire format. |
| [TICKET\_SUBPROTOCOL\_PREFIX](/api/@graphorin/protocol/subprotocol/variables/TICKET_SUBPROTOCOL_PREFIX.md) | Prefix for the single-use ticket that browser clients attach to the `Sec-WebSocket-Protocol` header. The server's upgrade handler splits the comma-separated list, finds the first `ticket.<value>` token, and validates the value against the in-memory ticket store before granting the connection. |

## Functions

| Function | Description |
| ------ | ------ |
| [formatTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/formatTicketSubprotocol.md) | Format a ticket value as a `Sec-WebSocket-Protocol` token suitable for browser clients (which cannot attach an `Authorization` header on the WebSocket upgrade). The companion server helper is [parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md). |
| [negotiateSubprotocol](/api/@graphorin/protocol/subprotocol/functions/negotiateSubprotocol.md) | Pick the single subprotocol the server should echo back. Returns `SUBPROTOCOL_NAME` when the client offered it, or `null` when no compatible variant was advertised. The function ignores `ticket.*` tokens - those are handled separately via [parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md). |
| [parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md) | Extract the ticket value from a single comma-separated client list (e.g. `'graphorin.protocol.v1, ticket.abc-123'`). Returns `undefined` if no `ticket.*` token is present. Whitespace around each comma-separated token is ignored. |
