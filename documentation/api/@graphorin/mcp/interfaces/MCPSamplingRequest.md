[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingRequest

# Interface: MCPSamplingRequest

Defined in: packages/mcp/src/client/types.ts:163

**`Stable`**

Server-initiated sampling request surfaced to the operator's handler
(typically backed by a `Provider`).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-includecontext"></a> `includeContext?` | `readonly` | `"none"` \| `"thisServer"` \| `"allServers"` | packages/mcp/src/client/types.ts:175 |
| <a id="property-maxtokens"></a> `maxTokens` | `readonly` | `number` | packages/mcp/src/client/types.ts:166 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`MCPSamplingMessage`](/api/@graphorin/mcp/interfaces/MCPSamplingMessage.md)[] | packages/mcp/src/client/types.ts:164 |
| <a id="property-modelpreferences"></a> `modelPreferences?` | `readonly` | \{ `costPriority?`: `number`; `hints?`: readonly \{ `name?`: `string`; \}[]; `intelligencePriority?`: `number`; `speedPriority?`: `number`; \} | packages/mcp/src/client/types.ts:169 |
| `modelPreferences.costPriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:171 |
| `modelPreferences.hints?` | `readonly` | readonly \{ `name?`: `string`; \}[] | packages/mcp/src/client/types.ts:170 |
| `modelPreferences.intelligencePriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:173 |
| `modelPreferences.speedPriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:172 |
| <a id="property-stopsequences"></a> `stopSequences?` | `readonly` | readonly `string`[] | packages/mcp/src/client/types.ts:168 |
| <a id="property-systemprompt"></a> `systemPrompt?` | `readonly` | `string` | packages/mcp/src/client/types.ts:165 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | packages/mcp/src/client/types.ts:167 |
