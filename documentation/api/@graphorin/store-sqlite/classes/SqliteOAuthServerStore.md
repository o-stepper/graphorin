[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteOAuthServerStore

# Class: SqliteOAuthServerStore

Defined in: packages/store-sqlite/src/oauth-server-store.ts:12

**`Stable`**

Default `OAuthServerStore` implementation. Persists OAuth
registration metadata + `SecretRef` URI strings; the actual token
material lives in `@graphorin/security`'s secret store and is
resolved by the URI at use time (DEC-139 / ADR-033).

## Implements

- [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md)

## Constructors

### Constructor

```ts
new SqliteOAuthServerStore(conn): SqliteOAuthServerStore;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:14

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteOAuthServerStore`

## Methods

### delete()

```ts
delete(id): Promise<void>;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:78

Remove the record for `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md).[`delete`](/api/@graphorin/core/interfaces/OAuthServerStore.md#delete)

***

### get()

```ts
get(id): Promise<
  | OAuthServerRecord
| null>;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:53

Read the record for `id`, returning `null` when absent.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)
  \| `null`\>

#### Implementation of

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md).[`get`](/api/@graphorin/core/interfaces/OAuthServerStore.md#get)

***

### list()

```ts
list(): Promise<readonly OAuthServerRecord[]>;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:58

Snapshot of all stored records, ordered by `id`.

#### Returns

`Promise`\&lt;readonly [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)[]\&gt;

#### Implementation of

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md).[`list`](/api/@graphorin/core/interfaces/OAuthServerStore.md#list)

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:18

Insert or replace the record for `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md).[`put`](/api/@graphorin/core/interfaces/OAuthServerStore.md#put)

***

### update()

```ts
update(id, patch): Promise<OAuthServerRecord>;
```

Defined in: packages/store-sqlite/src/oauth-server-store.ts:63

Apply a partial update to the record at `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `patch` | `Partial`\&lt;[`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)\&gt; |

#### Returns

`Promise`\&lt;[`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)\&gt;

#### Implementation of

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md).[`update`](/api/@graphorin/core/interfaces/OAuthServerStore.md#update)
