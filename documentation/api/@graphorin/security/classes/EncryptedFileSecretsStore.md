[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / EncryptedFileSecretsStore

# Class: EncryptedFileSecretsStore

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L60)

`SecretsStore` backed by an AES-256-GCM bundle on disk.

## Stable

## Implements

- [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)

## Constructors

### Constructor

```ts
new EncryptedFileSecretsStore(opts): EncryptedFileSecretsStore;
```

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L76)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`EncryptedFileSecretsStoreOptions`](/api/@graphorin/security/interfaces/EncryptedFileSecretsStoreOptions.md) |

#### Returns

`EncryptedFileSecretsStore`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"encrypted-file"` | [packages/security/src/secrets/stores/encrypted-file.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L61) |

## Methods

### delete()

```ts
delete(key, _scope?): Promise<void>;
```

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L148)

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

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L96)

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

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L161)

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

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L118)

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
opts?): Promise<void>;
```

Defined in: [packages/security/src/secrets/stores/encrypted-file.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/encrypted-file.ts#L131)

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

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`set`](/api/@graphorin/core/interfaces/SecretsStore.md#set)
