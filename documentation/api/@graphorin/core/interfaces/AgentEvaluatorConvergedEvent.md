[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: packages/core/src/types/agent-event.ts:395

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:399 |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/core/src/types/agent-event.ts:401 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:397 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:398 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/core/src/types/agent-event.ts:402 |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | packages/core/src/types/agent-event.ts:400 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | packages/core/src/types/agent-event.ts:396 |
