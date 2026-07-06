[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressWrittenEvent

# Interface: AgentProgressWrittenEvent

Defined in: [packages/core/src/types/agent-event.ts:487](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L487)

Emitted after `agent.progress.write(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:491](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L491) |
| <a id="property-ref"></a> `ref` | `readonly` | [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md) | [packages/core/src/types/agent-event.ts:492](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L492) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:489](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L489) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:490](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L490) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.written"` | [packages/core/src/types/agent-event.ts:488](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L488) |
