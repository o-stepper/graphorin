[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [client-message](/api/@graphorin/protocol/client-message/index.md) / RpcId

# Variable: RpcId

```ts
const RpcId: ZodUnion<[ZodString, ZodNumber]>;
```

Defined in: src/client-message.ts:23

**`Stable`**

Zod schema for RPC correlation ids (non-empty string or integer).
