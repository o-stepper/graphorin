[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentCancellingEvent

# Interface: AgentCancellingEvent

Defined in: [packages/core/src/types/agent-event.ts:354](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L354)

Emitted at the moment `agent.abort({ ... })` is called, before any
pending tool / provider calls have terminated. Subscribers use this
to render "cancelling..." UI before the run actually winds down.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | `boolean` | [packages/core/src/types/agent-event.ts:357](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L357) |
| <a id="property-onpendingapprovals"></a> `onPendingApprovals` | `readonly` | `"deny"` \| `"hold"` \| `"fail"` | [packages/core/src/types/agent-event.ts:358](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L358) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:356](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L356) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.cancelling"` | [packages/core/src/types/agent-event.ts:355](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L355) |
