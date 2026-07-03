[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / ServerIdentity

# Type Alias: ServerIdentity

```ts
type ServerIdentity = 
  | {
  argsHash: string;
  command: string;
  id: string;
  kind: "mcp-stdio";
  serverInfoName?: string;
}
  | {
  id: string;
  kind: "mcp-streamable-http";
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
}
  | {
  id: string;
  kind: "mcp-sse";
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
};
```

Defined in: packages/mcp/src/transport/types.ts:78

Server identity descriptor attached to every MCP-derived `Tool`.
Mirrors the shape consumed by the tool-registry collision
resolver; the `argsHash` / `urlHostname` fields are the
disambiguation keys the registry uses when surfacing collision
resolutions, while the canonical `id` field is the operator-
facing label.

## Stable
