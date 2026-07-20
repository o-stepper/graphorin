[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / isReplayMarkerFrame

# Function: isReplayMarkerFrame()

```ts
function isReplayMarkerFrame(message): message is { droppedCount?: number; eventId: string; kind: "replay-marker"; note?: string; subscriptionId: string; v: "1" };
```

Defined in: src/server-message.ts:289

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `result?`: `unknown`; `v`: `"1"`; \} \| \{ `error`: \{ `code`: `number`; `data?`: `unknown`; `message`: `string`; \}; `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `v`: `"1"`; \} \| \{ `kind`: `"subscribed"`; `snapshotEventId?`: `string`; `subject`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"unsubscribed"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"lifecycle"`; `reason?`: `string`; `status`: `"aborted"` \| `"running"` \| `"paused"` \| `"completed"` \| `"failed"`; `subscriptionId`: `string`; `v`: `"1"`; \} \| \{ `code`: `string`; `data?`: `unknown`; `fatal?`: `boolean`; `kind`: `"error"`; `message`: `string`; `subscriptionId?`: `string`; `v`: `"1"`; \} \| \{ `kind`: `"pong"`; `nonce?`: `string`; `v`: `"1"`; \} \| \{ `droppedCount?`: `number`; `eventId`: `string`; `kind`: `"replay-marker"`; `note?`: `string`; `subscriptionId`: `string`; `v`: `"1"`; \} |

## Returns

`message is { droppedCount?: number; eventId: string; kind: "replay-marker"; note?: string; subscriptionId: string; v: "1" }`
