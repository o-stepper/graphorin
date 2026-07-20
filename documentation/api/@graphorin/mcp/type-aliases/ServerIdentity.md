[**Graphorin API reference v0.13.8**](../../../index.md)

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
  reportedServerName?: string;
  serverInfoName?: string;
}
  | {
  id: string;
  kind: "mcp-streamable-http";
  reportedServerName?: string;
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
}
  | {
  id: string;
  kind: "mcp-sse";
  reportedServerName?: string;
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
};
```

Defined in: packages/mcp/src/transport/types.ts:78

**`Stable`**

Server identity descriptor attached to every MCP-derived `Tool`.
Mirrors the shape consumed by the tool-registry collision
resolver; the `argsHash` / `urlHostname` fields are the
disambiguation keys the registry uses when surfacing collision
resolutions, while the canonical `id` field is the operator-
facing label.

## Union Members

### Type Literal

```ts
{
  argsHash: string;
  command: string;
  id: string;
  kind: "mcp-stdio";
  reportedServerName?: string;
  serverInfoName?: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `argsHash` | `string` | - | packages/mcp/src/transport/types.ts:84 |
| `command` | `string` | - | packages/mcp/src/transport/types.ts:83 |
| `id` | `string` | Transport-derived id - see the union TSDoc. | packages/mcp/src/transport/types.ts:82 |
| `kind` | `"mcp-stdio"` | - | packages/mcp/src/transport/types.ts:80 |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | packages/mcp/src/transport/types.ts:87 |
| `serverInfoName?` | `string` | - | packages/mcp/src/transport/types.ts:85 |

***

### Type Literal

```ts
{
  id: string;
  kind: "mcp-streamable-http";
  reportedServerName?: string;
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `id` | `string` | Transport-derived id including a non-default port. | packages/mcp/src/transport/types.ts:92 |
| `kind` | `"mcp-streamable-http"` | - | packages/mcp/src/transport/types.ts:90 |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | packages/mcp/src/transport/types.ts:97 |
| `serverInfoName?` | `string` | - | packages/mcp/src/transport/types.ts:95 |
| `urlHostname` | `string` | - | packages/mcp/src/transport/types.ts:93 |
| `urlPath` | `string` | - | packages/mcp/src/transport/types.ts:94 |

***

### Type Literal

```ts
{
  id: string;
  kind: "mcp-sse";
  reportedServerName?: string;
  serverInfoName?: string;
  urlHostname: string;
  urlPath: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `id` | `string` | Transport-derived id including a non-default port. | packages/mcp/src/transport/types.ts:102 |
| `kind` | `"mcp-sse"` | - | packages/mcp/src/transport/types.ts:100 |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | packages/mcp/src/transport/types.ts:107 |
| `serverInfoName?` | `string` | - | packages/mcp/src/transport/types.ts:105 |
| `urlHostname` | `string` | - | packages/mcp/src/transport/types.ts:103 |
| `urlPath` | `string` | - | packages/mcp/src/transport/types.ts:104 |
