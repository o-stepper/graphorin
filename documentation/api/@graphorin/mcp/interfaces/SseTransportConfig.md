[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / SseTransportConfig

# Interface: SseTransportConfig

Defined in: packages/mcp/src/transport/types.ts:61

Options for the deprecated `'sse'` transport.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | packages/mcp/src/transport/types.ts:65 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | packages/mcp/src/transport/types.ts:64 |
| <a id="property-kind"></a> `kind` | `readonly` | `"sse"` | packages/mcp/src/transport/types.ts:62 |
| <a id="property-url"></a> `url` | `readonly` | `string` \| `URL` | packages/mcp/src/transport/types.ts:63 |
