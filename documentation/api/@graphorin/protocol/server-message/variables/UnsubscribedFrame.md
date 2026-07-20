[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / UnsubscribedFrame

# Variable: UnsubscribedFrame

```ts
const UnsubscribedFrame: ZodObject<{
  kind: ZodLiteral<"unsubscribed">;
  subscriptionId: ZodString;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  kind: "unsubscribed";
  subscriptionId: string;
  v: "1";
}, {
  kind: "unsubscribed";
  subscriptionId: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:105

**`Stable`**

Zod schema behind [ServerUnsubscribedFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerUnsubscribedFrame.md).
