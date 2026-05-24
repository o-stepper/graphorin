[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorIterationEvent

# Interface: AgentEvaluatorIterationEvent

Defined in: packages/core/src/types/agent-event.ts:369

Emitted per iteration of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:373 |
| <a id="property-critique"></a> `critique` | `readonly` | `string` | packages/core/src/types/agent-event.ts:377 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:378 |
| <a id="property-iteration"></a> `iteration` | `readonly` | `number` | packages/core/src/types/agent-event.ts:374 |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | packages/core/src/types/agent-event.ts:376 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:371 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/core/src/types/agent-event.ts:375 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:372 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.iteration"` | packages/core/src/types/agent-event.ts:370 |
