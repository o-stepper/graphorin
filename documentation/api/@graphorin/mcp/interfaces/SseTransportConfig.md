[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / SseTransportConfig

# Interface: SseTransportConfig

Defined in: [packages/mcp/src/transport/types.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L61)

Options for the deprecated `'sse'` transport.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | [packages/mcp/src/transport/types.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L65) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | [packages/mcp/src/transport/types.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L64) |
| <a id="property-kind"></a> `kind` | `readonly` | `"sse"` | [packages/mcp/src/transport/types.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L62) |
| <a id="property-url"></a> `url` | `readonly` | `string` \| `URL` | [packages/mcp/src/transport/types.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/transport/types.ts#L63) |
