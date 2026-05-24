[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: packages/core/src/types/agent-event.ts:386

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:390 |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/core/src/types/agent-event.ts:392 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:388 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:389 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/core/src/types/agent-event.ts:393 |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | packages/core/src/types/agent-event.ts:391 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | packages/core/src/types/agent-event.ts:387 |
