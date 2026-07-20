[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStepProviderResponse

# Interface: RunStepProviderResponse

Defined in: packages/core/src/types/run.ts:57

**`Stable`**

Journaled model response for one step (opt-in via the agent's
`recordProviderResponses`). Captures the RAW model output - the text
before any lateral-leak block replaced it in the transcript - so a
replay reproduces the original run faithfully.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | packages/core/src/types/run.ts:58 |
| <a id="property-text"></a> `text?` | `readonly` | `string` | packages/core/src/types/run.ts:59 |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | packages/core/src/types/run.ts:60 |
