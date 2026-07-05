[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayBuffer

# Interface: ReplayBuffer

Defined in: packages/server/src/ws/replay-buffer.ts:45

Per-subject replay buffer. Stores up to `maxEvents` per subject
with a TTL; thread-safe under the single-writer Node event loop
model.

## Stable

## Methods

### forget()

```ts
forget(subject): void;
```

Defined in: packages/server/src/ws/replay-buffer.ts:49

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |

#### Returns

`void`

***

### prune()

```ts
prune(): void;
```

Defined in: packages/server/src/ws/replay-buffer.ts:50

#### Returns

`void`

***

### push()

```ts
push(subject, event): void;
```

Defined in: packages/server/src/ws/replay-buffer.ts:46

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |
| `event` | \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} |
| `event.eventId` | `string` |
| `event.kind` | `"event"` |
| `event.payload?` | `unknown` |
| `event.subject` | `string` |
| `event.subscriptionId` | `string` |
| `event.type` | `string` |
| `event.v` | `"1"` |

#### Returns

`void`

***

### replay()

```ts
replay(subject, sinceEventId): ReplayBufferSlice;
```

Defined in: packages/server/src/ws/replay-buffer.ts:47

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |
| `sinceEventId` | `string` \| `undefined` |

#### Returns

[`ReplayBufferSlice`](/api/@graphorin/server/interfaces/ReplayBufferSlice.md)

***

### size()

```ts
size(subject): number;
```

Defined in: packages/server/src/ws/replay-buffer.ts:48

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |

#### Returns

`number`
