[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAIMessage

# Interface: GenAIMessage

Defined in: [packages/observability/src/gen-ai/types.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L96)

Single per-message record passed to [emitGenAIMessageEvents](/api/@graphorin/observability/functions/emitGenAIMessageEvents.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | - | [packages/observability/src/gen-ai/types.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L98) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | [packages/observability/src/gen-ai/types.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L106) |
| <a id="property-role"></a> `role` | `readonly` | [`GenAIMessageRole`](/api/@graphorin/observability/type-aliases/GenAIMessageRole.md) | - | [packages/observability/src/gen-ai/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L97) |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | - | [packages/observability/src/gen-ai/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L105) |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly \{ `arguments`: `string`; `id`: `string`; `name`: `string`; \}[] | Optional model-specific metadata (tool calls, names, …). | [packages/observability/src/gen-ai/types.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L100) |
