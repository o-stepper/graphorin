[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / StdioTransportConfig

# Interface: StdioTransportConfig

Defined in: packages/mcp/src/transport/types.ts:30

Options for the `'stdio'` transport.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | readonly `string`[] | - | packages/mcp/src/transport/types.ts:33 |
| <a id="property-command"></a> `command` | `readonly` | `string` | - | packages/mcp/src/transport/types.ts:32 |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | - | packages/mcp/src/transport/types.ts:35 |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | packages/mcp/src/transport/types.ts:34 |
| <a id="property-kind"></a> `kind` | `readonly` | `"stdio"` | - | packages/mcp/src/transport/types.ts:31 |
| <a id="property-stderr"></a> `stderr?` | `readonly` | `"inherit"` \| `"pipe"` \| `"ignore"` | How to handle the spawned child's stderr stream. Defaults to `'inherit'` so operator-supplied servers print diagnostics to the host process's stderr; `'pipe'` collects stderr into the transport for in-process logging; `'ignore'` discards it. | packages/mcp/src/transport/types.ts:42 |
