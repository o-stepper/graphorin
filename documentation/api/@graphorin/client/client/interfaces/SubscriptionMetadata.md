[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / SubscriptionMetadata

# Interface: SubscriptionMetadata

Defined in: [packages/client/src/graphorin-client.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L168)

Snapshot returned by [Subscription.metadata](/api/@graphorin/client/client/interfaces/Subscription.md#metadata).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-closed"></a> `closed` | `readonly` | `boolean` | - | [packages/client/src/graphorin-client.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L174) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/client/src/graphorin-client.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L169) |
| <a id="property-lasteventid"></a> `lastEventId` | `readonly` | `string` \| `undefined` | - | [packages/client/src/graphorin-client.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L173) |
| <a id="property-queuedevents"></a> `queuedEvents` | `readonly` | `number` | W-152: current buffered (undelivered) event-frame count. | [packages/client/src/graphorin-client.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L176) |
| <a id="property-snapshoteventid"></a> `snapshotEventId` | `readonly` | `string` \| `undefined` | - | [packages/client/src/graphorin-client.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L172) |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | - | [packages/client/src/graphorin-client.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L170) |
| <a id="property-target"></a> `target` | `readonly` | [`SubscriptionTarget`](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) | - | [packages/client/src/graphorin-client.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L171) |
