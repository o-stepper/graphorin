[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsDispatcher

# Interface: WsDispatcher

Defined in: packages/server/src/ws/dispatcher.ts:137

Public surface of the dispatcher.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-replaybuffer"></a> `replayBuffer` | `readonly` | [`ReplayBuffer`](/api/@graphorin/server/interfaces/ReplayBuffer.md) | packages/server/src/ws/dispatcher.ts:139 |
| <a id="property-sanitizer"></a> `sanitizer` | `readonly` | [`DeliveryCommentarySanitizer`](/api/@graphorin/server/interfaces/DeliveryCommentarySanitizer.md) | packages/server/src/ws/dispatcher.ts:138 |

## Methods

### emit()

```ts
emit(subject, frame): void;
```

Defined in: packages/server/src/ws/dispatcher.ts:163

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

Defined in: packages/server/src/ws/dispatcher.ts:165

Push a lifecycle frame to a single subscription.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |
| `status` | `"aborted"` \| `"running"` \| `"completed"` \| `"failed"` \| `"paused"` |
| `reason?` | `string` |

#### Returns

`void`

***

### listForSubscriber()

```ts
listForSubscriber(subscriberId): readonly WsSubscriptionSnapshot[];
```

Defined in: packages/server/src/ws/dispatcher.ts:171

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

Defined in: packages/server/src/ws/dispatcher.ts:144

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
| `unregister()` | () => `void` | packages/server/src/ws/dispatcher.ts:144 |

***

### shutdown()

```ts
shutdown(): void;
```

Defined in: packages/server/src/ws/dispatcher.ts:175

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

Defined in: packages/server/src/ws/dispatcher.ts:173

#### Returns

```ts
{
  subscribers: number;
  subscriptions: number;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `subscribers` | `number` | packages/server/src/ws/dispatcher.ts:173 |
| `subscriptions` | `number` | packages/server/src/ws/dispatcher.ts:173 |

***

### snapshotSubscription()

```ts
snapshotSubscription(subscriptionId): 
  | WsSubscriptionSnapshot
  | undefined;
```

Defined in: packages/server/src/ws/dispatcher.ts:172

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

Defined in: packages/server/src/ws/dispatcher.ts:151

Open a new subscription for an active subscriber. Returns either
the subscription snapshot + replayed-event count or a typed
failure reason the caller maps to the appropriate close code /
RPC error.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `sinceEventId?`: `string`; `subject`: `string`; `subscriberId`: `string`; `subscriptionId`: `string`; \} |
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

Defined in: packages/server/src/ws/dispatcher.ts:157

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |

#### Returns

`boolean`
