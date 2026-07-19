[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: packages/core/src/types/agent-event.ts:462

**`Stable`**

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:466 |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/core/src/types/agent-event.ts:468 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:464 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:465 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/core/src/types/agent-event.ts:469 |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | packages/core/src/types/agent-event.ts:467 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | packages/core/src/types/agent-event.ts:463 |
