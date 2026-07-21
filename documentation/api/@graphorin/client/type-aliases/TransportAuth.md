[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / TransportAuth

# Type Alias: TransportAuth

```ts
type TransportAuth = 
  | {
  kind: "bearer";
  token: string;
}
  | {
  kind: "ticket";
  ticketProvider: () => Promise<string>;
};
```

Defined in: packages/client/src/transport/types.ts:53

**`Stable`**

Authentication strategy passed to a transport. The bearer-token
shape is consumed by both transports (WS via the
`Authorization` header on Node SDK clients; SSE via the
`Authorization` header on every fetch); the ticket-provider shape
is only used by the WS browser path (the WebSocket browser API
does not allow custom headers, so the ticket rides the
`Sec-WebSocket-Protocol` header).
