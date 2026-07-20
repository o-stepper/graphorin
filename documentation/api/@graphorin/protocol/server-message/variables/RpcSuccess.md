[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / RpcSuccess

# Variable: RpcSuccess

```ts
const RpcSuccess: ZodEffects<ZodObject<{
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
}>;
```

Defined in: src/server-message.ts:55

**`Stable`**

Zod schema behind [ServerRpcSuccess](/api/@graphorin/protocol/server-message/type-aliases/ServerRpcSuccess.md).
