[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ReplayMarkerFrame

# Variable: ReplayMarkerFrame

```ts
const ReplayMarkerFrame: ZodObject<{
  droppedCount: ZodOptional<ZodNumber>;
  eventId: ZodString;
  kind: ZodLiteral<"replay-marker">;
  note: ZodOptional<ZodString>;
  subscriptionId: ZodString;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  droppedCount?: number;
  eventId: string;
  kind: "replay-marker";
  note?: string;
  subscriptionId: string;
  v: "1";
}, {
  droppedCount?: number;
  eventId: string;
  kind: "replay-marker";
  note?: string;
  subscriptionId: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:187

**`Stable`**

Zod schema behind [ServerReplayMarkerFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerReplayMarkerFrame.md).
