[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / isSubscribeRequest

# Function: isSubscribeRequest()

```ts
function isSubscribeRequest(message): message is { id: string | number; jsonrpc: "2.0"; method: "subscription.subscribe"; params: { sinceEventId?: string; subject: string }; v: "1" };
```

Defined in: src/client-message.ts:175

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"initialize"`; `params`: \{ `capabilities?`: `Record`\&lt;`string`, `unknown`\&gt;; `clientInfo`: \{ `name`: `string`; `version`: `string`; \}; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.subscribe"`; `params`: \{ `sinceEventId?`: `string`; `subject`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.unsubscribe"`; `params`: \{ `subscriptionId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"run.cancel"`; `params`: \{ `drain?`: `boolean`; `onPendingApprovals?`: `"deny"` \| `"preserve"`; `reason?`: `string`; `runId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"ping"`; `params?`: \{ `nonce?`: `string`; \}; `v`: `"1"`; \} \| \{ `jsonrpc`: `"2.0"`; `method`: `"notifications/cancelled"`; `params`: \{ `requestId`: `string`; \}; `v`: `"1"`; \} |

## Returns

message is \{ id: string \| number; jsonrpc: "2.0"; method: "subscription.subscribe"; params: \{ sinceEventId?: string; subject: string \}; v: "1" \}
