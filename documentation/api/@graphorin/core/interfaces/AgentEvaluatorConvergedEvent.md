[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorConvergedEvent

# Interface: AgentEvaluatorConvergedEvent

Defined in: [packages/core/src/types/agent-event.ts:455](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L455)

Emitted at the termination of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:459](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L459) |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:461](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L461) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:457](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L457) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:458](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L458) |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | [packages/core/src/types/agent-event.ts:462](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L462) |
| <a id="property-totaliterations"></a> `totalIterations` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:460](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L460) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.converged"` | [packages/core/src/types/agent-event.ts:456](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L456) |
