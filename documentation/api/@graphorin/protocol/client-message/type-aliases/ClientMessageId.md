[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / ClientMessageId

# Type Alias: ClientMessageId

```ts
type ClientMessageId = z.infer<typeof RpcId>;
```

Defined in: [packages/protocol/src/client-message.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/src/client-message.ts#L154)

Convenience type for the JSON-RPC `id` slot. Matches the Graphorin
subset (string + integer; no `null`, no float).

## Stable
