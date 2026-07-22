[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAIMessage

# Interface: GenAIMessage

Defined in: packages/observability/src/gen-ai/types.ts:96

**`Stable`**

Single per-message record passed to [emitGenAIMessageEvents](/api/@graphorin/observability/functions/emitGenAIMessageEvents.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | - | packages/observability/src/gen-ai/types.ts:98 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | packages/observability/src/gen-ai/types.ts:106 |
| <a id="property-role"></a> `role` | `readonly` | [`GenAIMessageRole`](/api/@graphorin/observability/type-aliases/GenAIMessageRole.md) | - | packages/observability/src/gen-ai/types.ts:97 |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | - | packages/observability/src/gen-ai/types.ts:105 |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly \{ `arguments`: `string`; `id`: `string`; `name`: `string`; \}[] | Optional model-specific metadata (tool calls, names, …). | packages/observability/src/gen-ai/types.ts:100 |
