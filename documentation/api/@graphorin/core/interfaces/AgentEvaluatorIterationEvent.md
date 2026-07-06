[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorIterationEvent

# Interface: AgentEvaluatorIterationEvent

Defined in: packages/core/src/types/agent-event.ts:418

Emitted per iteration of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:422 |
| <a id="property-critique"></a> `critique` | `readonly` | `string` | packages/core/src/types/agent-event.ts:426 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:427 |
| <a id="property-iteration"></a> `iteration` | `readonly` | `number` | packages/core/src/types/agent-event.ts:423 |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | packages/core/src/types/agent-event.ts:425 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:420 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/core/src/types/agent-event.ts:424 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:421 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.iteration"` | packages/core/src/types/agent-event.ts:419 |
