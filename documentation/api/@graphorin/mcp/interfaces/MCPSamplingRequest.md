[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingRequest

# Interface: MCPSamplingRequest

Defined in: [packages/mcp/src/client/types.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L163)

Server-initiated sampling request surfaced to the operator's handler
(typically backed by a `Provider`).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-includecontext"></a> `includeContext?` | `readonly` | `"none"` \| `"thisServer"` \| `"allServers"` | [packages/mcp/src/client/types.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L175) |
| <a id="property-maxtokens"></a> `maxTokens` | `readonly` | `number` | [packages/mcp/src/client/types.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L166) |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`MCPSamplingMessage`](/api/@graphorin/mcp/interfaces/MCPSamplingMessage.md)[] | [packages/mcp/src/client/types.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L164) |
| <a id="property-modelpreferences"></a> `modelPreferences?` | `readonly` | \{ `costPriority?`: `number`; `hints?`: readonly \{ `name?`: `string`; \}[]; `intelligencePriority?`: `number`; `speedPriority?`: `number`; \} | [packages/mcp/src/client/types.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L169) |
| `modelPreferences.costPriority?` | `readonly` | `number` | [packages/mcp/src/client/types.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L171) |
| `modelPreferences.hints?` | `readonly` | readonly \{ `name?`: `string`; \}[] | [packages/mcp/src/client/types.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L170) |
| `modelPreferences.intelligencePriority?` | `readonly` | `number` | [packages/mcp/src/client/types.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L173) |
| `modelPreferences.speedPriority?` | `readonly` | `number` | [packages/mcp/src/client/types.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L172) |
| <a id="property-stopsequences"></a> `stopSequences?` | `readonly` | readonly `string`[] | [packages/mcp/src/client/types.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L168) |
| <a id="property-systemprompt"></a> `systemPrompt?` | `readonly` | `string` | [packages/mcp/src/client/types.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L165) |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | [packages/mcp/src/client/types.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L167) |
