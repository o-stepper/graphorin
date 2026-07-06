[**Graphorin API reference v0.6.1**](../../../index.md)

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
}
  | {
  description?: string;
  mimeType?: string;
  name: string;
  size?: number;
  title?: string;
  type: "resource_link";
  uri: string;
};
```

Defined in: [packages/mcp/src/client/types.ts:313](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L313)

Discriminated union over MCP content parts.

## Union Members

### Type Literal

```ts
{
  text: string;
  type: "text";
}
```

***

### Type Literal

```ts
{
  data: string;
  mimeType: string;
  type: "image";
}
```

***

### Type Literal

```ts
{
  data: string;
  mimeType: string;
  type: "audio";
}
```

***

### Type Literal

```ts
{
  resource: {
     blob?: string;
     mimeType?: string;
     text?: string;
     uri: string;
  };
  type: "resource";
}
```

***

### Type Literal

```ts
{
  description?: string;
  mimeType?: string;
  name: string;
  size?: number;
  title?: string;
  type: "resource_link";
  uri: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `description?` | `string` | - | [packages/mcp/src/client/types.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L338) |
| `mimeType?` | `string` | - | [packages/mcp/src/client/types.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L339) |
| `name` | `string` | - | [packages/mcp/src/client/types.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L336) |
| `size?` | `number` | - | [packages/mcp/src/client/types.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L340) |
| `title?` | `string` | - | [packages/mcp/src/client/types.ts:337](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L337) |
| `type` | `"resource_link"` | A link to a resource the server can serve on demand (MCP `resource_link`). Unlike an embedded `resource`, the body is **not** inlined: the adapter surfaces a preview + the `uri` as a result handle so the model fetches it via `read_result` only when needed (WI-13 / P2-2, ties to WI-10 result handles). | [packages/mcp/src/client/types.ts:334](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L334) |
| `uri` | `string` | - | [packages/mcp/src/client/types.ts:335](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L335) |
