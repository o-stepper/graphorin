[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / PongFrame

# Variable: PongFrame

```ts
const PongFrame: ZodObject<{
  kind: ZodLiteral<"pong">;
  nonce: ZodOptional<ZodString>;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  kind: "pong";
  nonce?: string;
  v: "1";
}, {
  kind: "pong";
  nonce?: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:174

**`Stable`**

Zod schema behind [ServerPongFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerPongFrame.md).
