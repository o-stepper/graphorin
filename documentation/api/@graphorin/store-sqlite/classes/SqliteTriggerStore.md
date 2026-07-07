[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteTriggerStore

# Class: SqliteTriggerStore

Defined in: [packages/store-sqlite/src/trigger-store.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L18)

Default `TriggerStore` implementation. Backs the `@graphorin/triggers`
scheduler with persistent rows so cron / interval / idle / event
triggers survive process restarts (DEC-150).

Concurrency contract (W-133): two scheduler PROCESSES over one
database file are not a supported deployment (see the storage guide's
concurrency matrix). `recordFire` still carries a monotonic
wall-clock fence as best-effort defense in depth for that
unsupported case - a duplicate fixation with the same-or-earlier
`firedAt` is a no-op instead of rewinding trigger state.

## Stable

## Implements

- [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md)

## Constructors

### Constructor

```ts
new SqliteTriggerStore(conn): SqliteTriggerStore;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L20)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteTriggerStore`

## Methods

### get()

```ts
get(id): Promise<
  | TriggerState
| null>;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L50)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)
  \| `null`\>

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`get`](/api/@graphorin/core/interfaces/TriggerStore.md#get)

***

### list()

```ts
list(): Promise<readonly TriggerState[]>;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L55)

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`list`](/api/@graphorin/core/interfaces/TriggerStore.md#list)

***

### recordFire()

```ts
recordFire(
   id, 
   firedAt, 
nextFireAt?): Promise<void>;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L75)

Persist a fire. W-133: the update carries a monotonic fence -
a call whose `firedAt` is not strictly later than the stored
`last_fired_at` changes nothing, so a second (unsupported)
scheduler process re-fixing an old fire cannot rewind
`next_fire_at`/`missed_fires`. The fence is wall-clock ms:
two processes with the IDENTICAL `firedAt` both pass - accepted
as best-effort for a deployment the docs already exclude. The
in-process scheduler always calls this once per fire with a fresh
timestamp, so supported behaviour is unchanged.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `firedAt` | `string` |
| `nextFireAt?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`recordFire`](/api/@graphorin/core/interfaces/TriggerStore.md#recordfire)

***

### remove()

```ts
remove(id): Promise<void>;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L60)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`remove`](/api/@graphorin/core/interfaces/TriggerStore.md#remove)

***

### upsert()

```ts
upsert(state): Promise<void>;
```

Defined in: [packages/store-sqlite/src/trigger-store.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/trigger-store.ts#L24)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`upsert`](/api/@graphorin/core/interfaces/TriggerStore.md#upsert)
