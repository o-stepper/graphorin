[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / SubscribedFrame

# Variable: SubscribedFrame

```ts
const SubscribedFrame: ZodObject<{
  kind: ZodLiteral<"subscribed">;
  snapshotEventId: ZodOptional<ZodString>;
  subject: ZodString;
  subscriptionId: ZodString;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  kind: "subscribed";
  snapshotEventId?: string;
  subject: string;
  subscriptionId: string;
  v: "1";
}, {
  kind: "subscribed";
  snapshotEventId?: string;
  subject: string;
  subscriptionId: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:90

**`Stable`**

Zod schema behind [ServerSubscribedFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerSubscribedFrame.md).
