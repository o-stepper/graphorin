[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvaluatorIterationEvent

# Interface: AgentEvaluatorIterationEvent

Defined in: [packages/core/src/types/agent-event.ts:438](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L438)

Emitted per iteration of an `evaluatorOptimizer({...})` loop.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:442](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L442) |
| <a id="property-critique"></a> `critique` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:446](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L446) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:447](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L447) |
| <a id="property-iteration"></a> `iteration` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:443](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L443) |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | [packages/core/src/types/agent-event.ts:445](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L445) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:440](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L440) |
| <a id="property-score"></a> `score` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:444](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L444) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:441](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L441) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.evaluator.iteration"` | [packages/core/src/types/agent-event.ts:439](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L439) |
