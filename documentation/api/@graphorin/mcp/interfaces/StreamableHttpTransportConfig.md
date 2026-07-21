[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / StreamableHttpTransportConfig

# Interface: StreamableHttpTransportConfig

Defined in: packages/mcp/src/transport/types.ts:46

Options for the `'streamable-http'` transport.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Custom `fetch` implementation; defaults to the global `fetch`. | packages/mcp/src/transport/types.ts:57 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | packages/mcp/src/transport/types.ts:49 |
| <a id="property-kind"></a> `kind` | `readonly` | `"streamable-http"` | - | packages/mcp/src/transport/types.ts:47 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Optional pre-existing session id. Most operators leave this unset - the server assigns one on `initialize` and the client persists it for the lifetime of the connection. | packages/mcp/src/transport/types.ts:55 |
| <a id="property-url"></a> `url` | `readonly` | `string` \| `URL` | - | packages/mcp/src/transport/types.ts:48 |
