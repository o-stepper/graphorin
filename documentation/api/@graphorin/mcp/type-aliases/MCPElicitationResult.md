[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPElicitationResult

# Type Alias: MCPElicitationResult

```ts
type MCPElicitationResult = 
  | {
  action: "accept";
  content?: Readonly<Record<string, string | number | boolean | ReadonlyArray<string>>>;
}
  | {
  action: "decline";
}
  | {
  action: "cancel";
};
```

Defined in: packages/mcp/src/client/types.ts:124

**`Stable`**

Operator response to an [MCPElicitationRequest](/api/@graphorin/mcp/interfaces/MCPElicitationRequest.md). `accept` returns
the collected flat values; `decline`/`cancel` carry no content.
