[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteIdempotencyStore

# Class: SqliteIdempotencyStore

Defined in: [packages/store-sqlite/src/idempotency-store.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L49)

Default `IdempotencyStore` implementation.

## Stable

## Implements

- [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md)

## Constructors

### Constructor

```ts
new SqliteIdempotencyStore(conn): SqliteIdempotencyStore;
```

Defined in: [packages/store-sqlite/src/idempotency-store.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L51)

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

Defined in: [packages/store-sqlite/src/idempotency-store.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L92)

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

Defined in: [packages/store-sqlite/src/idempotency-store.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L73)

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

Defined in: [packages/store-sqlite/src/idempotency-store.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L96)

Delete records whose expiry is older than the supplied epoch-ms
instant. Production caller: the server's hourly
`scheduleIdempotencyPruning` sweep (started by `app-lifecycle`),
so expired rows no longer accumulate forever (W-065).

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

Defined in: [packages/store-sqlite/src/idempotency-store.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L55)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IdempotencyRecord`](/api/@graphorin/store-sqlite/interfaces/IdempotencyRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md).[`put`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md#put)
