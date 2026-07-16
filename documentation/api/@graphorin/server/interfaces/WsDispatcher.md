[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsDispatcher

# Interface: WsDispatcher

Defined in: [packages/server/src/ws/dispatcher.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L145)

Public surface of the dispatcher.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-replaybuffer"></a> `replayBuffer` | `readonly` | [`ReplayBuffer`](/api/@graphorin/server/interfaces/ReplayBuffer.md) | [packages/server/src/ws/dispatcher.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L147) |
| <a id="property-sanitizer"></a> `sanitizer` | `readonly` | [`DeliveryCommentarySanitizer`](/api/@graphorin/server/interfaces/DeliveryCommentarySanitizer.md) | [packages/server/src/ws/dispatcher.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L146) |

## Methods

### emit()

```ts
emit(subject, frame): void;
```

Defined in: [packages/server/src/ws/dispatcher.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L178)

Push an event into the dispatcher. Goes through the sanitizer,
validates against the protocol schema, persists into the replay
buffer, and fans out to every matching active subscription.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |
| `frame` | [`BareEventFrame`](/api/@graphorin/server/interfaces/BareEventFrame.md) |

#### Returns

`void`

***

### emitLifecycle()

```ts
emitLifecycle(
   subscriptionId, 
   status, 
   reason?): void;
```

Defined in: [packages/server/src/ws/dispatcher.ts:180](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L180)

Push a lifecycle frame to a single subscription.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |
| `status` | `"running"` \| `"completed"` \| `"failed"` \| `"aborted"` \| `"paused"` |
| `reason?` | `string` |

#### Returns

`void`

***

### listForSubscriber()

```ts
listForSubscriber(subscriberId): readonly WsSubscriptionSnapshot[];
```

Defined in: [packages/server/src/ws/dispatcher.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L186)

List active subscriptions for a given subscriber (diagnostics).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriberId` | `string` |

#### Returns

readonly [`WsSubscriptionSnapshot`](/api/@graphorin/server/interfaces/WsSubscriptionSnapshot.md)[]

***

### registerSubscriber()

```ts
registerSubscriber(handle): {
  unregister: void;
};
```

Defined in: [packages/server/src/ws/dispatcher.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L152)

Register a subscriber (one per WebSocket connection).
`unregister` is called on close.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handle` | [`WsSubscriberHandle`](/api/@graphorin/server/interfaces/WsSubscriberHandle.md) |

#### Returns

```ts
{
  unregister: void;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `unregister()` | () => `void` | [packages/server/src/ws/dispatcher.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L152) |

***

### shutdown()

```ts
shutdown(): void;
```

Defined in: [packages/server/src/ws/dispatcher.ts:190](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L190)

Clear in-memory state (used during graceful shutdown).

#### Returns

`void`

***

### size()

```ts
size(): {
  subscribers: number;
  subscriptions: number;
};
```

Defined in: [packages/server/src/ws/dispatcher.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L188)

#### Returns

```ts
{
  subscribers: number;
  subscriptions: number;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `subscribers` | `number` | [packages/server/src/ws/dispatcher.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L188) |
| `subscriptions` | `number` | [packages/server/src/ws/dispatcher.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L188) |

***

### snapshotSubscription()

```ts
snapshotSubscription(subscriptionId): 
  | WsSubscriptionSnapshot
  | undefined;
```

Defined in: [packages/server/src/ws/dispatcher.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L187)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |

#### Returns

  \| [`WsSubscriptionSnapshot`](/api/@graphorin/server/interfaces/WsSubscriptionSnapshot.md)
  \| `undefined`

***

### subscribe()

```ts
subscribe(input): SubscribeResult;
```

Defined in: [packages/server/src/ws/dispatcher.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L165)

Open a new subscription for an active subscriber. Returns either
the subscription snapshot + replayed-event count or a typed
failure reason the caller maps to the appropriate close code /
RPC error.

E-02 (S-15/8): with `deferReplay: true` the buffered frames are
captured but NOT delivered; the caller must invoke the returned
`dispatchReplay()` once its acknowledgement (e.g. the subscribe
RPC reply) is on the wire, so clients that key their subscription
map off that reply do not drop the replayed frames.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `deferReplay?`: `boolean`; `sinceEventId?`: `string`; `subject`: `string`; `subscriberId`: `string`; `subscriptionId`: `string`; \} |
| `input.deferReplay?` | `boolean` |
| `input.sinceEventId?` | `string` |
| `input.subject` | `string` |
| `input.subscriberId` | `string` |
| `input.subscriptionId` | `string` |

#### Returns

[`SubscribeResult`](/api/@graphorin/server/type-aliases/SubscribeResult.md)

***

### unsubscribe()

```ts
unsubscribe(subscriptionId): boolean;
```

Defined in: [packages/server/src/ws/dispatcher.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L172)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |

#### Returns

`boolean`
