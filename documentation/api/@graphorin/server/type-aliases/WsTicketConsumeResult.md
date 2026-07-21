[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsTicketConsumeResult

# Type Alias: WsTicketConsumeResult

```ts
type WsTicketConsumeResult = 
  | {
  ok: true;
  ticket: WsTicket;
}
  | {
  ok: false;
  reason: "unknown" | "consumed" | "expired";
};
```

Defined in: packages/server/src/ws/ticket.ts:41

**`Stable`**

Stable result of [WsTicketStore.consume](/api/@graphorin/server/interfaces/WsTicketStore.md#consume).
