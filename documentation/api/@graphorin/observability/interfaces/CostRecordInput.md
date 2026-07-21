[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostRecordInput

# Interface: CostRecordInput

Defined in: packages/observability/src/cost/types.ts:24

**`Stable`**

Per-call usage record fed into [CostTracker.record](/api/@graphorin/observability/interfaces/CostTracker.md#record).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:40 |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `readonly` | `number` | Prompt-cache READ leg (name mirrors core `Usage`). | packages/observability/src/cost/types.ts:30 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `readonly` | `number` | Prompt-cache WRITE leg (name mirrors core `Usage`). | packages/observability/src/cost/types.ts:32 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:27 |
| <a id="property-cost"></a> `cost?` | `readonly` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | - | packages/observability/src/cost/types.ts:33 |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:25 |
| <a id="property-parentspanid"></a> `parentSpanId?` | `readonly` | `string` | Optional parent span id (when the call is part of a nested run). | packages/observability/src/cost/types.ts:37 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:26 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:28 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:38 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:39 |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | Span id; used to thread parent-child rollups. | packages/observability/src/cost/types.ts:35 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:41 |
