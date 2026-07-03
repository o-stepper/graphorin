[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostRecordInput

# Interface: CostRecordInput

Defined in: packages/observability/src/cost/types.ts:24

Per-call usage record fed into [CostTracker.record](/api/@graphorin/observability/interfaces/CostTracker.md#record).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:36 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:27 |
| <a id="property-cost"></a> `cost?` | `readonly` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | - | packages/observability/src/cost/types.ts:29 |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:25 |
| <a id="property-parentspanid"></a> `parentSpanId?` | `readonly` | `string` | Optional parent span id (when the call is part of a nested run). | packages/observability/src/cost/types.ts:33 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:26 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:28 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:34 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:35 |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | Span id; used to thread parent-child rollups. | packages/observability/src/cost/types.ts:31 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/observability/src/cost/types.ts:37 |
