[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / KeyringSecretsStore

# Class: KeyringSecretsStore

Defined in: packages/security/src/secrets/stores/keyring.ts:35

**`Stable`**

`SecretsStore` backed by `@napi-rs/keyring`.

## Implements

- [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)

## Constructors

### Constructor

```ts
new KeyringSecretsStore(opts?): KeyringSecretsStore;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`KeyringSecretsStoreOptions`](/api/@graphorin/security/interfaces/KeyringSecretsStoreOptions.md) |

#### Returns

`KeyringSecretsStore`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"keyring"` | packages/security/src/secrets/stores/keyring.ts:36 |

## Methods

### delete()

```ts
delete(key, _scope?): Promise<void>;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:95

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `_scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`delete`](/api/@graphorin/core/interfaces/SecretsStore.md#delete)

***

### get()

```ts
get(key, _scope?): Promise<SecretValue | null>;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:44

Returns the secret if it exists, `null` otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `_scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) \| `null`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`get`](/api/@graphorin/core/interfaces/SecretsStore.md#get)

***

### list()

```ts
list(_scope?): Promise<readonly SecretMetadata[]>;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:104

Returns metadata about every key - never the values themselves.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`SecretMetadata`](/api/@graphorin/core/interfaces/SecretMetadata.md)[]\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`list`](/api/@graphorin/core/interfaces/SecretsStore.md#list)

***

### require()

```ts
require(key, _scope?): Promise<SecretValue>;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:67

Returns the secret or throws. Implementations enforce the per-tool
`secretsAllowed` ACL: if the current tool context disallows `key`,
throw `SecretAccessDeniedError`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `_scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/security/classes/SecretValue.md)\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`require`](/api/@graphorin/core/interfaces/SecretsStore.md#require)

***

### set()

```ts
set(
   key, 
   value, 
_opts?): Promise<void>;
```

Defined in: packages/security/src/secrets/stores/keyring.ts:81

Persist a secret. Implementations auto-wrap a plain string into a
`SecretValue` so callers don't have to.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | \| `string` \| [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) |
| `_opts?` | [`SecretsSetOptions`](/api/@graphorin/core/interfaces/SecretsSetOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`set`](/api/@graphorin/core/interfaces/SecretsStore.md#set)
