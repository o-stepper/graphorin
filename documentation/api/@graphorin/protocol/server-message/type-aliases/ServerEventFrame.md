[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ServerEventFrame

# Type Alias: ServerEventFrame

```ts
type ServerEventFrame = z.infer<typeof EventFrame>;
```

Defined in: src/server-message.ts:178

Convenience type aliases for callers that want to reference an
individual variant without `z.infer<typeof X>`.

## Stable
