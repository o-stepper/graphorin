[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / StreamableHttpTransportConfig

# Interface: StreamableHttpTransportConfig

Defined in: [packages/mcp/src/transport/types.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L46)

Options for the `'streamable-http'` transport.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Custom `fetch` implementation; defaults to the global `fetch`. | [packages/mcp/src/transport/types.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L57) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | [packages/mcp/src/transport/types.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L49) |
| <a id="property-kind"></a> `kind` | `readonly` | `"streamable-http"` | - | [packages/mcp/src/transport/types.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L47) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Optional pre-existing session id. Most operators leave this unset - the server assigns one on `initialize` and the client persists it for the lifetime of the connection. | [packages/mcp/src/transport/types.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L55) |
| <a id="property-url"></a> `url` | `readonly` | `string` \| `URL` | - | [packages/mcp/src/transport/types.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L48) |
