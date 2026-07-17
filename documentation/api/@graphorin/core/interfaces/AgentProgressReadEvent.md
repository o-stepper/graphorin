[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressReadEvent

# Interface: AgentProgressReadEvent

Defined in: [packages/core/src/types/agent-event.ts:507](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L507)

Emitted after `agent.progress.read(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:511](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L511) |
| <a id="property-queriedrole"></a> `queriedRole` | `readonly` | `string` \| `undefined` | [packages/core/src/types/agent-event.ts:514](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L514) |
| <a id="property-queriedrunid"></a> `queriedRunId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:513](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L513) |
| <a id="property-refs"></a> `refs` | `readonly` | readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[] | [packages/core/src/types/agent-event.ts:512](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L512) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:509](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L509) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:510](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L510) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.read"` | [packages/core/src/types/agent-event.ts:508](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L508) |
