[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteAuthTokenStore

# Class: SqliteAuthTokenStore

Defined in: packages/store-sqlite/src/auth-token-store.ts:11

**`Stable`**

Default `AuthTokenStore` implementation. Persists HMAC-SHA256 hashes
of issued server tokens (DEC-122 / ADR-027). Raw tokens are never
persisted - the runtime carries them via `SecretValue`.

## Implements

- [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md)

## Constructors

### Constructor

```ts
new SqliteAuthTokenStore(conn): SqliteAuthTokenStore;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:13

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteAuthTokenStore`

## Methods

### get()

```ts
get(id): Promise<
  | AuthTokenRecord
| null>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:35

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)
  \| `null`\>

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`get`](/api/@graphorin/core/interfaces/AuthTokenStore.md#get)

***

### getByHash()

```ts
getByHash(hashHex): Promise<
  | AuthTokenRecord
| null>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:40

Indexed lookup by HMAC hash. When present, the verifier
uses it on cache-miss instead of walking `list()` - O(1) instead of
an O(n) full-table scan per verification.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hashHex` | `string` |

#### Returns

`Promise`\<
  \| [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)
  \| `null`\>

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`getByHash`](/api/@graphorin/core/interfaces/AuthTokenStore.md#getbyhash)

***

### list()

```ts
list(): Promise<readonly AuthTokenRecord[]>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:49

#### Returns

`Promise`\&lt;readonly [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)[]\&gt;

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`list`](/api/@graphorin/core/interfaces/AuthTokenStore.md#list)

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:17

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`put`](/api/@graphorin/core/interfaces/AuthTokenStore.md#put)

***

### recordUse()

```ts
recordUse(id, usedAt): Promise<void>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:61

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `usedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`recordUse`](/api/@graphorin/core/interfaces/AuthTokenStore.md#recorduse)

***

### revoke()

```ts
revoke(id, revokedAt): Promise<void>;
```

Defined in: packages/store-sqlite/src/auth-token-store.ts:54

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `revokedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md).[`revoke`](/api/@graphorin/core/interfaces/AuthTokenStore.md#revoke)
