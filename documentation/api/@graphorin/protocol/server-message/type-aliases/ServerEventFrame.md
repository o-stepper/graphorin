[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ServerEventFrame

# Type Alias: ServerEventFrame

```ts
type ServerEventFrame = z.infer<typeof EventFrame>;
```

Defined in: server-message.ts:159

Convenience type aliases for callers that want to reference an
individual variant without `z.infer<typeof X>`.

## Stable
