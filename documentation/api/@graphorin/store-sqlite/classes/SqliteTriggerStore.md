[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteTriggerStore

# Class: SqliteTriggerStore

Defined in: packages/store-sqlite/src/trigger-store.ts:11

Default `TriggerStore` implementation. Backs the `@graphorin/triggers`
scheduler with persistent rows so cron / interval / idle / event
triggers survive process restarts (DEC-150).

## Stable

## Implements

- [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md)

## Constructors

### Constructor

```ts
new SqliteTriggerStore(conn): SqliteTriggerStore;
```

Defined in: packages/store-sqlite/src/trigger-store.ts:13

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

Defined in: packages/store-sqlite/src/trigger-store.ts:43

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

Defined in: packages/store-sqlite/src/trigger-store.ts:48

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

Defined in: packages/store-sqlite/src/trigger-store.ts:57

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

Defined in: packages/store-sqlite/src/trigger-store.ts:53

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

Defined in: packages/store-sqlite/src/trigger-store.ts:17

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md).[`upsert`](/api/@graphorin/core/interfaces/TriggerStore.md#upsert)
