[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / McpResourceReaderOptions

# Interface: McpResourceReaderOptions

Defined in: packages/mcp/src/client/mcp-resource-reader.ts:29

Configuration for [createMcpResourceReader](/api/@graphorin/mcp/functions/createMcpResourceReader.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-clients"></a> `clients` | `readonly` | readonly [`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md)[] | Clients consulted (in order) to resolve a resource URI. | packages/mcp/src/client/mcp-resource-reader.ts:31 |
| <a id="property-defaultmaxbytes"></a> `defaultMaxBytes?` | `readonly` | `number` | Default `maxBytes` when `read(...)` is called without one. Default `65536`. | packages/mcp/src/client/mcp-resource-reader.ts:33 |
