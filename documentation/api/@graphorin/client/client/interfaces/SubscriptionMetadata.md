[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / SubscriptionMetadata

# Interface: SubscriptionMetadata

Defined in: packages/client/src/graphorin-client.ts:158

Snapshot returned by [Subscription.metadata](/api/@graphorin/client/client/interfaces/Subscription.md#metadata).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-closed"></a> `closed` | `readonly` | `boolean` | - | packages/client/src/graphorin-client.ts:164 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/client/src/graphorin-client.ts:159 |
| <a id="property-lasteventid"></a> `lastEventId` | `readonly` | `string` \| `undefined` | - | packages/client/src/graphorin-client.ts:163 |
| <a id="property-queuedevents"></a> `queuedEvents` | `readonly` | `number` | W-152: current buffered (undelivered) event-frame count. | packages/client/src/graphorin-client.ts:166 |
| <a id="property-snapshoteventid"></a> `snapshotEventId` | `readonly` | `string` \| `undefined` | - | packages/client/src/graphorin-client.ts:162 |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | - | packages/client/src/graphorin-client.ts:160 |
| <a id="property-target"></a> `target` | `readonly` | [`SubscriptionTarget`](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) | - | packages/client/src/graphorin-client.ts:161 |
