[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AuthTokenStore

# Interface: AuthTokenStore

Defined in: [packages/core/src/contracts/auth-token-store.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L30)

Pluggable storage for server auth tokens. The default implementation
lives in `@graphorin/store-sqlite` (`auth_tokens` table). The server
package implements `verifyToken(...)` on top of this contract.

## Stable

## Methods

### get()

```ts
get(id): Promise<
  | AuthTokenRecord
| null>;
```

Defined in: [packages/core/src/contracts/auth-token-store.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L32)

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

Defined in: [packages/core/src/contracts/auth-token-store.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L41)

Indexed lookup by HMAC hash (SPL-19). When present, the verifier
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

Defined in: [packages/core/src/contracts/auth-token-store.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L33)

#### Returns

`Promise`\&lt;readonly [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md)[]\&gt;

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: [packages/core/src/contracts/auth-token-store.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L31)

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

Defined in: [packages/core/src/contracts/auth-token-store.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L35)

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

Defined in: [packages/core/src/contracts/auth-token-store.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `revokedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
