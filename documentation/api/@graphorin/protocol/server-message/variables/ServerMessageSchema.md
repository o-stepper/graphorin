[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ServerMessageSchema

# Variable: ServerMessageSchema

```ts
const ServerMessageSchema: ZodUnion<[ZodUnion<[ZodEffects<ZodObject<{
  id: ZodUnion<[ZodString, ZodNumber]>;
  jsonrpc: ZodLiteral<"2.0">;
  result: ZodUnknown;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  id: string | number;
  jsonrpc: "2.0";
  result?: unknown;
  v: "1";
}, {
  id: string | number;
  jsonrpc: "2.0";
  result?: unknown;
  v: "1";
}>, {
  id: string | number;
  jsonrpc: "2.0";
  result?: unknown;
  v: "1";
}, {
  id: string | number;
  jsonrpc: "2.0";
  result?: unknown;
  v: "1";
}>, ZodObject<{
  error: ZodObject<{
     code: ZodNumber;
     data: ZodOptional<ZodUnknown>;
     message: ZodString;
   }, "strict", ZodTypeAny, {
     code: number;
     data?: unknown;
     message: string;
   }, {
     code: number;
     data?: unknown;
     message: string;
  }>;
  id: ZodUnion<[ZodString, ZodNumber]>;
  jsonrpc: ZodLiteral<"2.0">;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  error: {
     code: number;
     data?: unknown;
     message: string;
  };
  id: string | number;
  jsonrpc: "2.0";
  v: "1";
}, {
  error: {
     code: number;
     data?: unknown;
     message: string;
  };
  id: string | number;
  jsonrpc: "2.0";
  v: "1";
}>]>, ZodDiscriminatedUnion<"kind", [ZodObject<{
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
}>, ZodObject<{
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
}>, ZodObject<{
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
}>]>]>;
```

Defined in: src/server-message.ts:219

**`Stable`**

Zod schema for every legal server → client frame. Validation runs
twice in the server pipeline: first when a route handler enqueues
the frame onto the dispatcher's send queue (so a malformed frame
never escapes the process), then again on the client side to
defend against protocol drift.
