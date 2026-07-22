[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingContent

# Type Alias: MCPSamplingContent

```ts
type MCPSamplingContent = 
  | {
  text: string;
  type: "text";
}
  | {
  data: string;
  mimeType: string;
  type: "image";
}
  | {
  data: string;
  mimeType: string;
  type: "audio";
};
```

Defined in: packages/mcp/src/client/types.ts:141

A single content block carried by a sampling message or result.
