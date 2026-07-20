[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: packages/core/src/types/agent-event.ts:486

**`Stable`**

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:490 |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/core/src/types/agent-event.ts:492 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:488 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:489 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/core/src/types/agent-event.ts:493 |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | packages/core/src/types/agent-event.ts:491 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | packages/core/src/types/agent-event.ts:487 |
