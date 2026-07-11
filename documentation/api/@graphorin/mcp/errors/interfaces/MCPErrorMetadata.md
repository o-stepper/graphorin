[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [errors](/api/@graphorin/mcp/errors/index.md) / MCPErrorMetadata

# Interface: MCPErrorMetadata

Defined in: [packages/mcp/src/errors/index.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L35)

Common metadata bag attached to every [GraphorinMCPError](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | [packages/mcp/src/errors/index.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L39) |
| <a id="property-httpstatus"></a> `httpStatus?` | `readonly` | `number` | [packages/mcp/src/errors/index.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L40) |
| <a id="property-lasteventid"></a> `lastEventId?` | `readonly` | `string` | [packages/mcp/src/errors/index.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L42) |
| <a id="property-server"></a> `server?` | `readonly` | `string` | [packages/mcp/src/errors/index.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L36) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | [packages/mcp/src/errors/index.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L41) |
| <a id="property-tool"></a> `tool?` | `readonly` | `string` | [packages/mcp/src/errors/index.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L37) |
| <a id="property-transport"></a> `transport?` | `readonly` | `"stdio"` \| `"streamable-http"` \| `"sse"` | [packages/mcp/src/errors/index.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L38) |
