[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / ClientMessageSchema

# Variable: ClientMessageSchema

```ts
const ClientMessageSchema: ZodDiscriminatedUnion<"method", [ZodObject<{
  id: ZodUnion<[ZodString, ZodNumber]>;
  jsonrpc: ZodLiteral<"2.0">;
  method: ZodLiteral<"initialize">;
  params: ZodObject<{
     capabilities: ZodOptional<ZodRecord<ZodString, ZodUnknown>>;
     clientInfo: ZodObject<{
        name: ZodString;
        version: ZodString;
      }, "strict", ZodTypeAny, {
        name: string;
        version: string;
      }, {
        name: string;
        version: string;
     }>;
   }, "strict", ZodTypeAny, {
     capabilities?: Record<string, unknown>;
     clientInfo: {
        name: string;
        version: string;
     };
   }, {
     capabilities?: Record<string, unknown>;
     clientInfo: {
        name: string;
        version: string;
     };
  }>;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  id: string | number;
  jsonrpc: "2.0";
  method: "initialize";
  params: {
     capabilities?: Record<string, unknown>;
     clientInfo: {
        name: string;
        version: string;
     };
  };
  v: "1";
}, {
  id: string | number;
  jsonrpc: "2.0";
  method: "initialize";
  params: {
     capabilities?: Record<string, unknown>;
     clientInfo: {
        name: string;
        version: string;
     };
  };
  v: "1";
}>, ZodObject<{
  id: ZodUnion<[ZodString, ZodNumber]>;
  jsonrpc: ZodLiteral<"2.0">;
  method: ZodLiteral<"subscription.subscribe">;
  params: ZodObject<{
     sinceEventId: ZodOptional<ZodString>;
     subject: ZodString;
   }, "strict", ZodTypeAny, {
     sinceEventId?: string;
     subject: string;
   }, {
     sinceEventId?: string;
     subject: string;
  }>;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  id: string | number;
  jsonrpc: "2.0";
  method: "subscription.subscribe";
  params: {
     sinceEventId?: string;
     subject: string;
  };
  v: "1";
}, {
  id: string | number;
  jsonrpc: "2.0";
  method: "subscription.subscribe";
  params: {
     sinceEventId?: string;
     subject: string;
  };
  v: "1";
}>, ZodObject<{
  id: ZodUnion<[ZodString, ZodNumber]>;
  jsonrpc: ZodLiteral<"2.0">;
  method: ZodLiteral<"subscription.unsubscribe">;
  params: ZodObject<{
     subscriptionId: ZodString;
   }, "strict", ZodTypeAny, {
     subscriptionId: string;
   }, {
     subscriptionId: string;
  }>;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  id: string | number;
  jsonrpc: "2.0";
  method: "subscription.unsubscribe";
  params: {
     subscriptionId: string;
  };
  v: "1";
}, {
  id: string | number;
  jsonrpc: "2.0";
  method: "subscription.unsubscribe";
  params: {
     subscriptionId: string;
  };
  v: "1";
}>]>;
```

Defined in: client-message.ts:130

Zod schema for every legal client → server frame. Use
[ClientMessageSchema](/api/@graphorin/protocol/client-message/variables/ClientMessageSchema.md).safeParse() inside the server upgrade
handler before dispatching to the corresponding subscription /
cancel / ping handler.

## Stable
