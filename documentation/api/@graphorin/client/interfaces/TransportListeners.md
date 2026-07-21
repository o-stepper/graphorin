[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / TransportListeners

# Interface: TransportListeners

Defined in: packages/client/src/transport/types.ts:64

**`Stable`**

Minimal listener surface the transport invokes in lifecycle order:
`onOpen` ⇒ `onFrame*` (zero or more) ⇒ `onClose`. `onError` may
fire at any time before `onClose`.

## Methods

### onClose()

```ts
onClose(reason): void;
```

Defined in: packages/client/src/transport/types.ts:68

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | [`TransportCloseReason`](/api/@graphorin/client/interfaces/TransportCloseReason.md) |

#### Returns

`void`

***

### onError()

```ts
onError(error): void;
```

Defined in: packages/client/src/transport/types.ts:67

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `Error` |

#### Returns

`void`

***

### onFrame()

```ts
onFrame(frame): void;
```

Defined in: packages/client/src/transport/types.ts:66

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `frame` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `result?`: `unknown`; `v`: `"1"`; \} \| \{ `error`: \{ `code`: `number`; `data?`: `unknown`; `message`: `string`; \}; `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `v`: `"1"`; \} \| \{ `kind`: `"subscribed"`; `snapshotEventId?`: `string`; `subject`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"unsubscribed"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"lifecycle"`; `reason?`: `string`; `status`: `"aborted"` \| `"running"` \| `"paused"` \| `"completed"` \| `"failed"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `code`: `string`; `data?`: `unknown`; `fatal?`: `boolean`; `kind`: `"error"`; `message`: `string`; `subscriptionId?`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"pong"`; `nonce?`: `string`; `v`: `"1"`; \} \| \{ `droppedCount?`: `number`; `eventId`: `string`; `kind`: `"replay-marker"`; `note?`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} |

#### Returns

`void`

***

### onOpen()

```ts
onOpen(): void;
```

Defined in: packages/client/src/transport/types.ts:65

#### Returns

`void`
