[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / Transport

# Interface: Transport

Defined in: [packages/client/src/transport/types.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L92)

Active transport handle. The client owns the handle and disposes
it via [Transport.close](/api/@graphorin/client/interfaces/Transport.md#close) on every cleanup path.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | [`TransportKind`](/api/@graphorin/client/type-aliases/TransportKind.md) | - | [packages/client/src/transport/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L93) |
| <a id="property-lasteventid"></a> `lastEventId` | `readonly` | `string` \| `undefined` | Last server-issued event id observed on this connection. | [packages/client/src/transport/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L105) |
| <a id="property-url"></a> `url` | `readonly` | `string` | - | [packages/client/src/transport/types.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L94) |

## Methods

### close()

```ts
close(code?, reason?): void;
```

Defined in: [packages/client/src/transport/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L103)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code?` | `number` |
| `reason?` | `string` |

#### Returns

`void`

***

### send()

```ts
send(frame): void;
```

Defined in: [packages/client/src/transport/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/types.ts#L102)

Send a client → server frame. Throws when the transport is not
in the open state, or when the underlying back-end does not
support send (the SSE transport throws every send via
`TransportFailedError` - clients
should fall back to REST for control-plane operations on SSE).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `frame` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"initialize"`; `params`: \{ `capabilities?`: `Record`\&lt;`string`, `unknown`\&gt;; `clientInfo`: \{ `name`: `string`; `version`: `string`; \}; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.subscribe"`; `params`: \{ `sinceEventId?`: `string`; `subject`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.unsubscribe"`; `params`: \{ `subscriptionId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"run.cancel"`; `params`: \{ `drain?`: `boolean`; `onPendingApprovals?`: `"deny"` \| `"preserve"`; `reason?`: `string`; `runId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"ping"`; `params?`: \{ `nonce?`: `string`; \}; `v`: `"1"`; \} \| \{ `jsonrpc`: `"2.0"`; `method`: `"notifications/cancelled"`; `params`: \{ `requestId`: `string`; \}; `v`: `"1"`; \} |

#### Returns

`void`
