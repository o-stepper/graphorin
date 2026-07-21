[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentCancellingEvent

# Interface: AgentCancellingEvent

Defined in: packages/core/src/types/agent-event.ts:385

**`Stable`**

Emitted at the moment `agent.abort({ ... })` is called, before any
pending tool / provider calls have terminated. Subscribers use this
to render "cancelling..." UI before the run actually winds down.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | `boolean` | packages/core/src/types/agent-event.ts:388 |
| <a id="property-onpendingapprovals"></a> `onPendingApprovals` | `readonly` | `"deny"` \| `"hold"` \| `"fail"` | packages/core/src/types/agent-event.ts:389 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:387 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.cancelling"` | packages/core/src/types/agent-event.ts:386 |
