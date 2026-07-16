[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostRecordInput

# Interface: CostRecordInput

Defined in: [packages/observability/src/cost/types.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L24)

Per-call usage record fed into [CostTracker.record](/api/@graphorin/observability/interfaces/CostTracker.md#record).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | [packages/observability/src/cost/types.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L40) |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `readonly` | `number` | Prompt-cache READ leg (W-092; name mirrors core `Usage`). | [packages/observability/src/cost/types.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L30) |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `readonly` | `number` | Prompt-cache WRITE leg (W-092; name mirrors core `Usage`). | [packages/observability/src/cost/types.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L32) |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | - | [packages/observability/src/cost/types.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L27) |
| <a id="property-cost"></a> `cost?` | `readonly` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | - | [packages/observability/src/cost/types.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L33) |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | [packages/observability/src/cost/types.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L25) |
| <a id="property-parentspanid"></a> `parentSpanId?` | `readonly` | `string` | Optional parent span id (when the call is part of a nested run). | [packages/observability/src/cost/types.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L37) |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | - | [packages/observability/src/cost/types.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L26) |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `readonly` | `number` | - | [packages/observability/src/cost/types.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L28) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | - | [packages/observability/src/cost/types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L38) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | [packages/observability/src/cost/types.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L39) |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | Span id; used to thread parent-child rollups. | [packages/observability/src/cost/types.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L35) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | [packages/observability/src/cost/types.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L41) |
