[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsSubscriptionSnapshot

# Interface: WsSubscriptionSnapshot

Defined in: packages/server/src/ws/dispatcher.ts:102

**`Stable`**

Snapshot of an active subscription. Surfaced via
[WsDispatcher.snapshotSubscription](/api/@graphorin/server/interfaces/WsDispatcher.md#snapshotsubscription).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | packages/server/src/ws/dispatcher.ts:108 |
| <a id="property-lasteventid"></a> `lastEventId` | `readonly` | `string` \| `undefined` | packages/server/src/ws/dispatcher.ts:109 |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:104 |
| <a id="property-subjectkind"></a> `subjectKind` | `readonly` | \| `"session-events"` \| `"session-run-events"` \| `"agent-run-events"` \| `"workflow-events"` \| `"workflow-run-events"` \| `"memory-conflicts"` \| `"audit-events"` | packages/server/src/ws/dispatcher.ts:105 |
| <a id="property-subscriberid"></a> `subscriberId` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:106 |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:103 |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | packages/server/src/ws/dispatcher.ts:107 |
