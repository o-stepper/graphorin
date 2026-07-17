[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / IdempotencyStore

# Interface: IdempotencyStore

Defined in: [packages/store-sqlite/src/idempotency-store.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L31)

Pluggable idempotency cache. The `@graphorin/server` package
(Phase 14) consumes this surface; the schema itself ships in
Phase 05's migration 008 so the framework only owns one set of
SQL tables.

## Stable

## Methods

### delete()

```ts
delete(key): Promise<void>;
```

Defined in: [packages/store-sqlite/src/idempotency-store.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(key): Promise<
  | IdempotencyRecord
| null>;
```

Defined in: [packages/store-sqlite/src/idempotency-store.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L33)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<
  \| [`IdempotencyRecord`](/api/@graphorin/store-sqlite/interfaces/IdempotencyRecord.md)
  \| `null`\>

***

### prune()

```ts
prune(olderThan): Promise<number>;
```

Defined in: [packages/store-sqlite/src/idempotency-store.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L41)

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

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: [packages/store-sqlite/src/idempotency-store.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/idempotency-store.ts#L32)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IdempotencyRecord`](/api/@graphorin/store-sqlite/interfaces/IdempotencyRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
