[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteSuspendedRunStore

# Class: SqliteSuspendedRunStore

Defined in: packages/store-sqlite/src/suspended-run-store.ts:47

**`Stable`**

Default `SuspendedRunStore` implementation.

## Implements

- [`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md)

## Constructors

### Constructor

```ts
new SqliteSuspendedRunStore(conn): SqliteSuspendedRunStore;
```

Defined in: packages/store-sqlite/src/suspended-run-store.ts:49

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteSuspendedRunStore`

## Methods

### delete()

```ts
delete(runId): Promise<void>;
```

Defined in: packages/store-sqlite/src/suspended-run-store.ts:80

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md).[`delete`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md#delete)

***

### get()

```ts
get(runId): Promise<
  | SuspendedRunRecord
| undefined>;
```

Defined in: packages/store-sqlite/src/suspended-run-store.ts:73

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\<
  \| [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md)
  \| `undefined`\>

#### Implementation of

[`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md).[`get`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md#get)

***

### list()

```ts
list(): Promise<readonly SuspendedRunRecord[]>;
```

Defined in: packages/store-sqlite/src/suspended-run-store.ts:84

Every parked run, oldest suspension first - boot hydration.

#### Returns

`Promise`\&lt;readonly [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md)[]\&gt;

#### Implementation of

[`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md).[`list`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md#list)

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/store-sqlite/src/suspended-run-store.ts:53

Insert or refresh a suspension. A re-put for the same `runId`
replaces the state but keeps the original `suspendedAt`, so the
column always answers "how long has this approval been waiting".

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md).[`put`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md#put)
