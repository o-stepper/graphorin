[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressWrittenEvent

# Interface: AgentProgressWrittenEvent

Defined in: [packages/core/src/types/agent-event.ts:494](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L494)

Emitted after `agent.progress.write(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:498](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L498) |
| <a id="property-ref"></a> `ref` | `readonly` | [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md) | [packages/core/src/types/agent-event.ts:499](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L499) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:496](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L496) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:497](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L497) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.written"` | [packages/core/src/types/agent-event.ts:495](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L495) |
