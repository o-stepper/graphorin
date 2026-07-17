[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorIterationEvent

# Interface: AgentEvaluatorIterationEvent

Defined in: [packages/core/src/types/agent-event.ts:445](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L445)

Emitted per iteration of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:449](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L449) |
| <a id="property-critique"></a> `critique` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:453](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L453) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:454](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L454) |
| <a id="property-iteration"></a> `iteration` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:450](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L450) |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | [packages/core/src/types/agent-event.ts:452](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L452) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:447](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L447) |
| <a id="property-score"></a> `score` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:451](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L451) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:448](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L448) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.iteration"` | [packages/core/src/types/agent-event.ts:446](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L446) |
