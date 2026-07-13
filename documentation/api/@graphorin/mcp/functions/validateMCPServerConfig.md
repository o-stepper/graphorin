[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / validateMCPServerConfig

# Function: validateMCPServerConfig()

```ts
function validateMCPServerConfig(opts): void;
```

Defined in: [packages/mcp/src/helpers/validate-config.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/helpers/validate-config.ts#L22)

Throws [MCPInvalidConfigError](/api/@graphorin/mcp/errors/classes/MCPInvalidConfigError.md) on invalid configuration.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `resumable?`: `boolean`; `transport`: [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md); \} |
| `opts.resumable?` | `boolean` |
| `opts.transport` | [`MCPTransportConfig`](/api/@graphorin/mcp/type-aliases/MCPTransportConfig.md) |

## Returns

`void`

## Stable
