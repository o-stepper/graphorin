[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AuthTokenStore

# Interface: AuthTokenStore

Defined in: packages/core/src/contracts/auth-token-store.ts:30

**`Stable`**

Pluggable storage for server auth tokens. The default implementation
lives in `@graphorin/store-sqlite` (`auth_tokens` table). The server
package implements `verifyToken(...)` on top of this contract.

## Methods

### get()

```ts
get(id): Promise<
  | AuthTokenRecord
| null>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:32

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)
  \| `null`\>

***

### getByHash()?

```ts
optional getByHash(hashHex): Promise<
  | AuthTokenRecord
| null>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:41

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

***

### list()

```ts
list(): Promise<readonly AuthTokenRecord[]>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:33

#### Returns

`Promise`\&lt;readonly [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)[]\&gt;

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:31

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordUse()

```ts
recordUse(id, usedAt): Promise<void>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:35

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `usedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### revoke()

```ts
revoke(id, revokedAt): Promise<void>;
```

Defined in: packages/core/src/contracts/auth-token-store.ts:34

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `revokedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
