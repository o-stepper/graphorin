[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ServerEventFrame

# Type Alias: ServerEventFrame

```ts
type ServerEventFrame = z.infer<typeof EventFrame>;
```

Defined in: [packages/protocol/src/server-message.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/src/server-message.ts#L185)

Convenience type aliases for callers that want to reference an
individual variant without `z.infer<typeof X>`.

## Stable
