[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsTicketStoreOptions

# Interface: WsTicketStoreOptions

Defined in: packages/server/src/ws/ticket.ts:50

**`Stable`**

Options accepted by [createWsTicketStore](/api/@graphorin/server/functions/createWsTicketStore.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxoutstanding"></a> `maxOutstanding?` | `readonly` | `number` | Cap on the number of unconsumed tickets retained. Default `1_000`. | packages/server/src/ws/ticket.ts:54 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/ws/ticket.ts:55 |
| <a id="property-randombytes"></a> `randomBytes?` | `readonly` | (`length`) => `Uint8Array` | Random-bytes generator. Tests pass a deterministic source so ticket values are reproducible. | packages/server/src/ws/ticket.ts:60 |
| <a id="property-ttlms"></a> `ttlMs?` | `readonly` | `number` | Default `300_000` (5 min). | packages/server/src/ws/ticket.ts:52 |
