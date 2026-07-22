[**Graphorin API reference v0.13.13**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / EventFrame

# Variable: EventFrame

```ts
const EventFrame: ZodObject<{
  eventId: ZodString;
  kind: ZodLiteral<"event">;
  payload: ZodUnknown;
  subject: ZodString;
  subscriptionId: ZodString;
  type: ZodString;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
}, {
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:125

**`Stable`**

Zod schema behind [ServerEventFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerEventFrame.md).
