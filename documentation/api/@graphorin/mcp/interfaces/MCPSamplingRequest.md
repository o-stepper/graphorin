[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingRequest

# Interface: MCPSamplingRequest

Defined in: packages/mcp/src/client/types.ts:149

Server-initiated sampling request surfaced to the operator's handler
(typically backed by a `Provider`).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-includecontext"></a> `includeContext?` | `readonly` | `"none"` \| `"thisServer"` \| `"allServers"` | packages/mcp/src/client/types.ts:161 |
| <a id="property-maxtokens"></a> `maxTokens` | `readonly` | `number` | packages/mcp/src/client/types.ts:152 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`MCPSamplingMessage`](/api/@graphorin/mcp/interfaces/MCPSamplingMessage.md)[] | packages/mcp/src/client/types.ts:150 |
| <a id="property-modelpreferences"></a> `modelPreferences?` | `readonly` | \{ `costPriority?`: `number`; `hints?`: readonly \{ `name?`: `string`; \}[]; `intelligencePriority?`: `number`; `speedPriority?`: `number`; \} | packages/mcp/src/client/types.ts:155 |
| `modelPreferences.costPriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:157 |
| `modelPreferences.hints?` | `readonly` | readonly \{ `name?`: `string`; \}[] | packages/mcp/src/client/types.ts:156 |
| `modelPreferences.intelligencePriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:159 |
| `modelPreferences.speedPriority?` | `readonly` | `number` | packages/mcp/src/client/types.ts:158 |
| <a id="property-stopsequences"></a> `stopSequences?` | `readonly` | readonly `string`[] | packages/mcp/src/client/types.ts:154 |
| <a id="property-systemprompt"></a> `systemPrompt?` | `readonly` | `string` | packages/mcp/src/client/types.ts:151 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | packages/mcp/src/client/types.ts:153 |
