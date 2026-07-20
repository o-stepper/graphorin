[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsTicket

# Interface: WsTicket

Defined in: packages/server/src/ws/ticket.ts:28

**`Stable`**

Stable shape returned by [WsTicketStore.issue](/api/@graphorin/server/interfaces/WsTicketStore.md#issue).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `number` | packages/server/src/ws/ticket.ts:30 |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | packages/server/src/ws/ticket.ts:31 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | packages/server/src/ws/ticket.ts:33 |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | packages/server/src/ws/ticket.ts:32 |
| <a id="property-value"></a> `value` | `readonly` | `string` | packages/server/src/ws/ticket.ts:29 |
