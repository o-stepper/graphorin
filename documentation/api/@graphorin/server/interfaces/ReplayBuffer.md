[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayBuffer

# Interface: ReplayBuffer

Defined in: [packages/server/src/ws/replay-buffer.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L57)

Per-subject replay buffer. Stores up to `maxEvents` per subject
with a TTL; thread-safe under the single-writer Node event loop
model.

## Stable

## Methods

### forget()

```ts
forget(subject): void;
```

Defined in: [packages/server/src/ws/replay-buffer.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L61)

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

Defined in: [packages/server/src/ws/replay-buffer.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L62)

#### Returns

`void`

***

### push()

```ts
push(subject, event): void;
```

Defined in: [packages/server/src/ws/replay-buffer.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L58)

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

Defined in: [packages/server/src/ws/replay-buffer.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L59)

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

Defined in: [packages/server/src/ws/replay-buffer.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L60)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | `string` |

#### Returns

`number`

***

### stats()?

```ts
optional stats(): ReplayBufferStats;
```

Defined in: [packages/server/src/ws/replay-buffer.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L69)

Occupancy snapshot (W-028). OPTIONAL so external implementations
of this `@stable` interface keep compiling; `createReplayBuffer`
always provides it. When absent, the `/v1/metrics` replay-buffer
gauge degrades to `0`.

#### Returns

[`ReplayBufferStats`](/api/@graphorin/server/ws/interfaces/ReplayBufferStats.md)
