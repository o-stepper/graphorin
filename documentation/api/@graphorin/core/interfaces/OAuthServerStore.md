[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / OAuthServerStore

# Interface: OAuthServerStore

Defined in: packages/core/src/contracts/oauth-server-store.ts:67

Pluggable storage for OAuth server registrations + token metadata.

The default implementation lives in `@graphorin/store-sqlite`
(`oauth_servers` table). `@graphorin/security` ships an in-memory
implementation that callers can use until the SQLite-backed store
is wired up.

## Stable

## Methods

### delete()

```ts
delete(id): Promise<void>;
```

Defined in: packages/core/src/contracts/oauth-server-store.ts:77

Remove the record for `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(id): Promise<
  | OAuthServerRecord
| null>;
```

Defined in: packages/core/src/contracts/oauth-server-store.ts:71

Read the record for `id`, returning `null` when absent.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)
  \| `null`\>

***

### list()

```ts
list(): Promise<readonly OAuthServerRecord[]>;
```

Defined in: packages/core/src/contracts/oauth-server-store.ts:73

Snapshot of all stored records, ordered by `id`.

#### Returns

`Promise`\&lt;readonly [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)[]\&gt;

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/core/src/contracts/oauth-server-store.ts:69

Insert or replace the record for `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### update()

```ts
update(id, patch): Promise<OAuthServerRecord>;
```

Defined in: packages/core/src/contracts/oauth-server-store.ts:75

Apply a partial update to the record at `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `patch` | `Partial`\&lt;[`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)\&gt; |

#### Returns

`Promise`\&lt;[`OAuthServerRecord`](/api/@graphorin/core/interfaces/OAuthServerRecord.md)\&gt;
