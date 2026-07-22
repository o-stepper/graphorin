[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createWsTicketStore

# Function: createWsTicketStore()

```ts
function createWsTicketStore(options?): WsTicketStore;
```

Defined in: packages/server/src/ws/ticket.ts:91

**`Stable`**

Build the default in-memory ticket store. Production deployments
use exactly one store per process (multiple processes would each
issue their own tickets - there is no shared state because the
single-user-per-process default applies).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`WsTicketStoreOptions`](/api/@graphorin/server/interfaces/WsTicketStoreOptions.md) |

## Returns

[`WsTicketStore`](/api/@graphorin/server/interfaces/WsTicketStore.md)
