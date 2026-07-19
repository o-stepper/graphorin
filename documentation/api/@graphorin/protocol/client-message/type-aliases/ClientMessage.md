[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / ClientMessage

# Type Alias: ClientMessage

```ts
type ClientMessage = z.infer<typeof ClientMessageSchema>;
```

Defined in: src/client-message.ts:146

**`Stable`**

Inferred TypeScript union for the `ClientMessage` discriminator. A
value satisfying this type round-trips through
[ClientMessageSchema](/api/@graphorin/protocol/client-message/variables/ClientMessageSchema.md) without throwing.
