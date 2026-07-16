[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretsStore

# Interface: SecretsStore

Defined in: [packages/core/src/contracts/secrets-store.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L43)

Pluggable secret-managing storage. Concrete implementations live in
`@graphorin/security` (`KeyringSecretsStore`, `EncryptedFileSecretsStore`,
`EnvSecretsStore`, `MemorySecretsStore`).

The interface is intentionally narrow: every method either returns a
`SecretValue` or a piece of metadata that is safe to log. The raw
value is never returned as a `string` from this surface.

## Stable

## Methods

### delete()

```ts
delete(key, scope?): Promise<void>;
```

Defined in: [packages/core/src/contracts/secrets-store.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L60)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(key, scope?): Promise<SecretValue | null>;
```

Defined in: [packages/core/src/contracts/secrets-store.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L45)

Returns the secret if it exists, `null` otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) \| `null`\&gt;

***

### list()

```ts
list(scope?): Promise<readonly SecretMetadata[]>;
```

Defined in: [packages/core/src/contracts/secrets-store.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L63)

Returns metadata about every key - never the values themselves.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`SecretMetadata`](/api/@graphorin/core/interfaces/SecretMetadata.md)[]\&gt;

***

### require()

```ts
require(key, scope?): Promise<SecretValue>;
```

Defined in: [packages/core/src/contracts/secrets-store.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L52)

Returns the secret or throws. Implementations enforce the per-tool
`secretsAllowed` ACL: if the current tool context disallows `key`,
throw `SecretAccessDeniedError`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)\&gt;

***

### set()

```ts
set(
   key, 
   value, 
opts?): Promise<void>;
```

Defined in: [packages/core/src/contracts/secrets-store.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L58)

Persist a secret. Implementations auto-wrap a plain string into a
`SecretValue` so callers don't have to.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | \| `string` \| [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) |
| `opts?` | [`SecretsSetOptions`](/api/@graphorin/core/interfaces/SecretsSetOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
