[**Graphorin API reference v0.10.1**](../../../index.md)

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

Defined in: [packages/mcp/src/transport/types.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L78)

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
| `argsHash` | `string` | - | [packages/mcp/src/transport/types.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L84) |
| `command` | `string` | - | [packages/mcp/src/transport/types.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L83) |
| `id` | `string` | Transport-derived id (W-016) - see the union TSDoc. | [packages/mcp/src/transport/types.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L82) |
| `kind` | `"mcp-stdio"` | - | [packages/mcp/src/transport/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L80) |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | [packages/mcp/src/transport/types.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L87) |
| `serverInfoName?` | `string` | - | [packages/mcp/src/transport/types.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L85) |

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
| `id` | `string` | Transport-derived id including a non-default port (W-016). | [packages/mcp/src/transport/types.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L92) |
| `kind` | `"mcp-streamable-http"` | - | [packages/mcp/src/transport/types.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L90) |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | [packages/mcp/src/transport/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L97) |
| `serverInfoName?` | `string` | - | [packages/mcp/src/transport/types.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L95) |
| `urlHostname` | `string` | - | [packages/mcp/src/transport/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L93) |
| `urlPath` | `string` | - | [packages/mcp/src/transport/types.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L94) |

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
| `id` | `string` | Transport-derived id including a non-default port (W-016). | [packages/mcp/src/transport/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L102) |
| `kind` | `"mcp-sse"` | - | [packages/mcp/src/transport/types.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L100) |
| `reportedServerName?` | `string` | Self-reported `serverInfo.name` - display/logs ONLY, never identity. | [packages/mcp/src/transport/types.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L107) |
| `serverInfoName?` | `string` | - | [packages/mcp/src/transport/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L105) |
| `urlHostname` | `string` | - | [packages/mcp/src/transport/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L103) |
| `urlPath` | `string` | - | [packages/mcp/src/transport/types.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L104) |

## Stable
