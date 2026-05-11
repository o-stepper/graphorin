[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPContentPart

# Type Alias: MCPContentPart

```ts
type MCPContentPart = 
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
}
  | {
  resource: {
     blob?: string;
     mimeType?: string;
     text?: string;
     uri: string;
  };
  type: "resource";
};
```

Defined in: packages/mcp/src/client/types.ts:159

Discriminated union over MCP content parts.
