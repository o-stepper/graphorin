[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / formatMCPServerName

# Function: formatMCPServerName()

```ts
function formatMCPServerName(transport): string;
```

Defined in: packages/mcp/src/helpers/identity.ts:117

**`Stable`**

Operator-facing single-line label for a [MCPTransportConfig](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md).
Suitable for trace attributes, audit rows, and CLI output.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `transport` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) |

## Returns

`string`
