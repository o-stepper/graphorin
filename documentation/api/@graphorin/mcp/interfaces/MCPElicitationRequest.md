[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPElicitationRequest

# Interface: MCPElicitationRequest

Defined in: packages/mcp/src/client/types.ts:111

**`Stable`**

Server-initiated elicitation request surfaced to the operator's HITL
handler.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-message"></a> `message` | `readonly` | `string` | Human-readable prompt the server wants answered. | packages/mcp/src/client/types.ts:113 |
| <a id="property-requestedschema"></a> `requestedSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | JSON-Schema-like shape (`{ type: 'object', properties, required? }`) for the requested input. | packages/mcp/src/client/types.ts:115 |
