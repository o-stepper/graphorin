[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / SubscriptionMetadata

# Interface: SubscriptionMetadata

Defined in: packages/client/src/graphorin-client.ts:182

**`Stable`**

Snapshot returned by [Subscription.metadata](/api/@graphorin/client/client/interfaces/Subscription.md#metadata).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-closed"></a> `closed` | `readonly` | `boolean` | - | packages/client/src/graphorin-client.ts:188 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/client/src/graphorin-client.ts:183 |
| <a id="property-lasteventid"></a> `lastEventId` | `readonly` | `string` \| `undefined` | - | packages/client/src/graphorin-client.ts:187 |
| <a id="property-queuedevents"></a> `queuedEvents` | `readonly` | `number` | Current buffered (undelivered) event-frame count. | packages/client/src/graphorin-client.ts:190 |
| <a id="property-snapshoteventid"></a> `snapshotEventId` | `readonly` | `string` \| `undefined` | - | packages/client/src/graphorin-client.ts:186 |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | - | packages/client/src/graphorin-client.ts:184 |
| <a id="property-target"></a> `target` | `readonly` | [`SubscriptionTarget`](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) | - | packages/client/src/graphorin-client.ts:185 |
