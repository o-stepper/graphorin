[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / McpResourceReaderOptions

# Interface: McpResourceReaderOptions

Defined in: packages/mcp/src/client/mcp-resource-reader.ts:29

Configuration for [createMcpResourceReader](/api/@graphorin/mcp/functions/createMcpResourceReader.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowcrossserver"></a> `allowCrossServer?` | `readonly` | `boolean` | Allow a BARE (unscoped) resource URI to be tried against every configured client. Default `false` - handles minted by the adapter are scoped (`mcp:<serverId>:<uri>`) and resolve ONLY against their originating server, so a malicious server's link (or a prompt-injected model) cannot fetch a resource from a different, more-trusted server (the cross-server confused-deputy hop). Enable only when you accept that risk for legacy handles. | packages/mcp/src/client/mcp-resource-reader.ts:43 |
| <a id="property-clients"></a> `clients` | `readonly` | readonly [`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md)[] | Clients consulted (in order) to resolve a resource URI. | packages/mcp/src/client/mcp-resource-reader.ts:31 |
| <a id="property-defaultmaxbytes"></a> `defaultMaxBytes?` | `readonly` | `number` | Default `maxBytes` when `read(...)` is called without one. Default `65536`. | packages/mcp/src/client/mcp-resource-reader.ts:33 |
