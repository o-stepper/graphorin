[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStep

# Interface: RunStep

Defined in: packages/core/src/types/run.ts:22

Single step inside an agent run. The agent runtime appends one
`RunStep` per provider call.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | Stable agent id active for this step (changes after a handoff). | packages/core/src/types/run.ts:31 |
| <a id="property-endedat"></a> `endedAt?` | `readonly` | `string` | - | packages/core/src/types/run.ts:25 |
| <a id="property-providerresponse"></a> `providerResponse?` | `readonly` | [`RunStepProviderResponse`](/api/@graphorin/core/interfaces/RunStepProviderResponse.md) | The model response this step produced, recorded when the agent runs with `recordProviderResponses: true` (C3). Enables deterministic replay: `createReplayProvider(state)` serves these back in order so a run re-executes without live model calls. | packages/core/src/types/run.ts:38 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:24 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/core/src/types/run.ts:23 |
| <a id="property-toolcalls"></a> `toolCalls` | `readonly` | readonly [`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;[] | - | packages/core/src/types/run.ts:27 |
| <a id="property-usage"></a> `usage?` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:26 |
