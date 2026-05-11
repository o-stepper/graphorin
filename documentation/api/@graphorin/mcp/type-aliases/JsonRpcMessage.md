[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / JsonRpcMessage

# Type Alias: JsonRpcMessage

```ts
type JsonRpcMessage = Readonly<{
  jsonrpc: "2.0";
} & Record<string, unknown>>;
```

Defined in: packages/mcp/src/event-store/types.ts:25

Generic JSON-RPC message shape (intentionally narrow).
