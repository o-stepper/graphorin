[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsTicket

# Interface: WsTicket

Defined in: [packages/server/src/ws/ticket.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L28)

Stable shape returned by [WsTicketStore.issue](/api/@graphorin/server/interfaces/WsTicketStore.md#issue).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `number` | [packages/server/src/ws/ticket.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L30) |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | [packages/server/src/ws/ticket.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L31) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | [packages/server/src/ws/ticket.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L33) |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | [packages/server/src/ws/ticket.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L32) |
| <a id="property-value"></a> `value` | `readonly` | `string` | [packages/server/src/ws/ticket.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L29) |
