[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorIterationEvent

# Interface: AgentEvaluatorIterationEvent

Defined in: packages/core/src/types/agent-event.ts:469

**`Stable`**

Emitted per iteration of an `evaluatorOptimizer({...})` loop.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:473 |
| <a id="property-critique"></a> `critique` | `readonly` | `string` | packages/core/src/types/agent-event.ts:477 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:478 |
| <a id="property-iteration"></a> `iteration` | `readonly` | `number` | packages/core/src/types/agent-event.ts:474 |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | packages/core/src/types/agent-event.ts:476 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:471 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/core/src/types/agent-event.ts:475 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:472 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.iteration"` | packages/core/src/types/agent-event.ts:470 |
