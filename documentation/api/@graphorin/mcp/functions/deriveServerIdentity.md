[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / deriveServerIdentity

# Function: deriveServerIdentity()

```ts
function deriveServerIdentity(transport, serverInfoName?): ServerIdentity;
```

Defined in: packages/mcp/src/helpers/identity.ts:26

Compute the canonical [ServerIdentity](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) for the supplied
transport. The id is suitable for use as a registry key and as the
operator-facing label in audit rows + trace attributes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `transport` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) |
| `serverInfoName?` | `string` |

## Returns

[`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md)

## Stable
