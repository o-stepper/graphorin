[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAIAttributes

# Interface: GenAIAttributes

Defined in: packages/observability/src/gen-ai/types.ts:117

**`Stable`**

Per-span attribute payload expected by [emitGenAIAttributes](/api/@graphorin/observability/functions/emitGenAIAttributes.md).
The fields mirror the OpenTelemetry GenAI semantic conventions and
are merged with the existing Graphorin-prefixed attributes - the
`gen_ai.*` family is additive, never replacing.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:126 |
| <a id="property-agentname"></a> `agentName?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:127 |
| <a id="property-finishreasons"></a> `finishReasons?` | `readonly` | readonly `string`[] | packages/observability/src/gen-ai/types.ts:124 |
| <a id="property-inputtokens"></a> `inputTokens?` | `readonly` | `number` | packages/observability/src/gen-ai/types.ts:122 |
| <a id="property-operation"></a> `operation?` | `readonly` | [`GenAIOperationName`](/api/@graphorin/observability/type-aliases/GenAIOperationName.md) | packages/observability/src/gen-ai/types.ts:125 |
| <a id="property-outputtokens"></a> `outputTokens?` | `readonly` | `number` | packages/observability/src/gen-ai/types.ts:123 |
| <a id="property-requestmodel"></a> `requestModel?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:119 |
| <a id="property-responseid"></a> `responseId?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:121 |
| <a id="property-responsemodel"></a> `responseModel?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:120 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:128 |
| <a id="property-system"></a> `system?` | `readonly` | [`GenAISystem`](/api/@graphorin/observability/type-aliases/GenAISystem.md) | packages/observability/src/gen-ai/types.ts:118 |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:131 |
| <a id="property-tooldescription"></a> `toolDescription?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:132 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | packages/observability/src/gen-ai/types.ts:129 |
| <a id="property-tooltype"></a> `toolType?` | `readonly` | [`GenAIToolType`](/api/@graphorin/observability/type-aliases/GenAIToolType.md) | packages/observability/src/gen-ai/types.ts:130 |
