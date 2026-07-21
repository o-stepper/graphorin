[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / ClientMessageId

# Type Alias: ClientMessageId

```ts
type ClientMessageId = z.infer<typeof RpcId>;
```

Defined in: src/client-message.ts:159

**`Stable`**

Convenience type for the JSON-RPC `id` slot. Matches the Graphorin
subset (string + integer; no `null`, no float).
