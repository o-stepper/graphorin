[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createWsTicketStore

# Function: createWsTicketStore()

```ts
function createWsTicketStore(options?): WsTicketStore;
```

Defined in: [packages/server/src/ws/ticket.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L91)

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

## Stable
