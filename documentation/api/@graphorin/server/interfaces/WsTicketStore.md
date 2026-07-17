[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsTicketStore

# Interface: WsTicketStore

Defined in: [packages/server/src/ws/ticket.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L69)

Pluggable in-memory ticket store used by the WS upgrade handler +
the `POST /v1/session/ws-ticket` route.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ttlms"></a> `ttlMs` | `readonly` | `number` | [packages/server/src/ws/ticket.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L70) |

## Methods

### consume()

```ts
consume(value): WsTicketConsumeResult;
```

Defined in: [packages/server/src/ws/ticket.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L72)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

[`WsTicketConsumeResult`](/api/@graphorin/server/type-aliases/WsTicketConsumeResult.md)

***

### issue()

```ts
issue(input): WsTicket;
```

Defined in: [packages/server/src/ws/ticket.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L71)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `scopes`: readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[]; `tokenId`: `string`; \} |
| `input.scopes` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] |
| `input.tokenId` | `string` |

#### Returns

[`WsTicket`](/api/@graphorin/server/interfaces/WsTicket.md)

***

### prune()

```ts
prune(): number;
```

Defined in: [packages/server/src/ws/ticket.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L74)

Drop expired entries; called on every `consume()`.

#### Returns

`number`

***

### size()

```ts
size(): number;
```

Defined in: [packages/server/src/ws/ticket.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/ticket.ts#L75)

#### Returns

`number`
