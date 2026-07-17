[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / isRunCancelRequest

# Function: isRunCancelRequest()

```ts
function isRunCancelRequest(message): message is { id: string | number; jsonrpc: "2.0"; method: "run.cancel"; params: { drain?: boolean; onPendingApprovals?: "deny" | "preserve"; reason?: string; runId: string }; v: "1" };
```

Defined in: [packages/protocol/src/client-message.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/src/client-message.ts#L184)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"initialize"`; `params`: \{ `capabilities?`: `Record`\&lt;`string`, `unknown`\&gt;; `clientInfo`: \{ `name`: `string`; `version`: `string`; \}; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.subscribe"`; `params`: \{ `sinceEventId?`: `string`; `subject`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"subscription.unsubscribe"`; `params`: \{ `subscriptionId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"run.cancel"`; `params`: \{ `drain?`: `boolean`; `onPendingApprovals?`: `"deny"` \| `"preserve"`; `reason?`: `string`; `runId`: `string`; \}; `v`: `"1"`; \} \| \{ `id`: `string` \| `number`; `jsonrpc`: `"2.0"`; `method`: `"ping"`; `params?`: \{ `nonce?`: `string`; \}; `v`: `"1"`; \} \| \{ `jsonrpc`: `"2.0"`; `method`: `"notifications/cancelled"`; `params`: \{ `requestId`: `string`; \}; `v`: `"1"`; \} |

## Returns

message is \{ id: string \| number; jsonrpc: "2.0"; method: "run.cancel"; params: \{ drain?: boolean; onPendingApprovals?: "deny" \| "preserve"; reason?: string; runId: string \}; v: "1" \}

## Stable
