[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsSubscriberHandle

# Interface: WsSubscriberHandle

Defined in: packages/server/src/ws/dispatcher.ts:75

Subscriber surface used by the dispatcher. Each WebSocket
connection wraps its `WSContext.send` in this interface so the
dispatcher does not depend on `@hono/node-ws` types directly.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-grantedscopes"></a> `grantedScopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | packages/server/src/ws/dispatcher.ts:78 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:76 |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:77 |

## Methods

### bufferedAmount()?

```ts
optional bufferedAmount(): number;
```

Defined in: packages/server/src/ws/dispatcher.ts:92

Optional buffered-byte sample. The dispatcher reads this on every
emit to detect sustained backpressure and close the connection
with the Graphorin `flow.throttled` code (4006) before the OS-
level send buffer collapses. Consumers backed by `@hono/node-ws`
can return the underlying `ws.bufferedAmount`. When the field is
not implemented, the dispatcher falls back to the per-connection
outstanding-event counter.

#### Returns

`number`

***

### close()

```ts
close(code, reason): void;
```

Defined in: packages/server/src/ws/dispatcher.ts:82

Close the underlying WebSocket with a Graphorin close code.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `number` |
| `reason` | `string` |

#### Returns

`void`

***

### send()

```ts
send(frame): void;
```

Defined in: packages/server/src/ws/dispatcher.ts:80

Send a server frame; the dispatcher already validated it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `frame` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `result?`: `unknown`; `v`: `"1"`; \} \| \{ `error`: \{ `code`: `number`; `data?`: `unknown`; `message`: `string`; \}; `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `v`: `"1"`; \} \| \{ `kind`: `"subscribed"`; `snapshotEventId?`: `string`; `subject`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"unsubscribed"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"lifecycle"`; `reason?`: `string`; `status`: `"running"` \| `"completed"` \| `"failed"` \| `"aborted"` \| `"paused"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `code`: `string`; `data?`: `unknown`; `fatal?`: `boolean`; `kind`: `"error"`; `message`: `string`; `subscriptionId?`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"pong"`; `nonce?`: `string`; `v`: `"1"`; \} \| \{ `droppedCount?`: `number`; `eventId`: `string`; `kind`: `"replay-marker"`; `note?`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} |

#### Returns

`void`
