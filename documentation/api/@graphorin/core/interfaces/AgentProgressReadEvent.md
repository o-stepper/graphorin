[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressReadEvent

# Interface: AgentProgressReadEvent

Defined in: [packages/core/src/types/agent-event.ts:500](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L500)

Emitted after `agent.progress.read(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:504](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L504) |
| <a id="property-queriedrole"></a> `queriedRole` | `readonly` | `string` \| `undefined` | [packages/core/src/types/agent-event.ts:507](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L507) |
| <a id="property-queriedrunid"></a> `queriedRunId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:506](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L506) |
| <a id="property-refs"></a> `refs` | `readonly` | readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[] | [packages/core/src/types/agent-event.ts:505](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L505) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:502](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L502) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:503](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L503) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.read"` | [packages/core/src/types/agent-event.ts:501](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L501) |
