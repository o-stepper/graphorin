[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteIdempotencyStore

# Class: SqliteIdempotencyStore

Defined in: packages/store-sqlite/src/idempotency-store.ts:43

Default `IdempotencyStore` implementation.

## Stable

## Implements

- [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md)

## Constructors

### Constructor

```ts
new SqliteIdempotencyStore(conn): SqliteIdempotencyStore;
```

Defined in: packages/store-sqlite/src/idempotency-store.ts:45

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteIdempotencyStore`

## Methods

### delete()

```ts
delete(key): Promise<void>;
```

Defined in: packages/store-sqlite/src/idempotency-store.ts:86

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md).[`delete`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md#delete)

***

### get()

```ts
get(key): Promise<
  | IdempotencyRecord
| null>;
```

Defined in: packages/store-sqlite/src/idempotency-store.ts:67

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<
  \| [`IdempotencyRecord`](/api/@graphorin/store-sqlite/interfaces/IdempotencyRecord.md)
  \| `null`\>

#### Implementation of

[`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md).[`get`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md#get)

***

### prune()

```ts
prune(olderThan): Promise<number>;
```

Defined in: packages/store-sqlite/src/idempotency-store.ts:90

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `olderThan` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md).[`prune`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md#prune)

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/store-sqlite/src/idempotency-store.ts:49

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IdempotencyRecord`](/api/@graphorin/store-sqlite/interfaces/IdempotencyRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md).[`put`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md#put)
