[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / RpcFailure

# Variable: RpcFailure

```ts
const RpcFailure: ZodObject<{
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
}>;
```

Defined in: src/server-message.ts:76

**`Stable`**

Zod schema behind [ServerRpcFailure](/api/@graphorin/protocol/server-message/type-aliases/ServerRpcFailure.md).
