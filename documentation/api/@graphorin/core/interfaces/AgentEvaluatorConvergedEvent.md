[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: packages/core/src/types/agent-event.ts:411

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:415 |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/core/src/types/agent-event.ts:417 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:413 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:414 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/core/src/types/agent-event.ts:418 |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | packages/core/src/types/agent-event.ts:416 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | packages/core/src/types/agent-event.ts:412 |
