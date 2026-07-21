[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStep

# Interface: RunStep

Defined in: packages/core/src/types/run.ts:23

**`Stable`**

Single step inside an agent run. The agent runtime appends one
`RunStep` per provider call.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | Stable agent id active for this step (changes after a handoff). | packages/core/src/types/run.ts:32 |
| <a id="property-endedat"></a> `endedAt?` | `readonly` | `string` | - | packages/core/src/types/run.ts:26 |
| <a id="property-finishreason"></a> `finishReason?` | `readonly` | [`FinishReason`](/api/@graphorin/core/type-aliases/FinishReason.md) | Why the step's provider call ended (`'stop'`, `'tool-calls'`, `'length'`, ...). `'length'` on a completed run means the step's text may be truncated at the output-token ceiling. Absent on states persisted before this field existed. | packages/core/src/types/run.ts:39 |
| <a id="property-providerresponse"></a> `providerResponse?` | `readonly` | [`RunStepProviderResponse`](/api/@graphorin/core/interfaces/RunStepProviderResponse.md) | The model response this step produced, recorded when the agent runs with `recordProviderResponses: true`. Enables deterministic replay: `createReplayProvider(state)` serves these back in order so a run re-executes without live model calls. | packages/core/src/types/run.ts:46 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:25 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/core/src/types/run.ts:24 |
| <a id="property-toolcalls"></a> `toolCalls` | `readonly` | readonly [`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;[] | - | packages/core/src/types/run.ts:28 |
| <a id="property-usage"></a> `usage?` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:27 |
