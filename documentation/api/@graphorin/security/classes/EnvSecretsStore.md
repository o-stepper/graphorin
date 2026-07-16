[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / EnvSecretsStore

# Class: EnvSecretsStore

Defined in: [packages/security/src/secrets/stores/env.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L45)

`SecretsStore` backed by `process.env`. Read-only by default -
enabling `allowMutation: true` keeps the API workable for tests but
still emits a single `console.warn` per mutation.

## Stable

## Implements

- [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)

## Constructors

### Constructor

```ts
new EnvSecretsStore(opts?): EnvSecretsStore;
```

Defined in: [packages/security/src/secrets/stores/env.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L50)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`EnvSecretsStoreOptions`](/api/@graphorin/security/interfaces/EnvSecretsStoreOptions.md) |

#### Returns

`EnvSecretsStore`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"env"` | [packages/security/src/secrets/stores/env.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L46) |

## Methods

### delete()

```ts
delete(key, _scope?): Promise<void>;
```

Defined in: [packages/security/src/secrets/stores/env.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L126)

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

Defined in: [packages/security/src/secrets/stores/env.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L56)

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

Defined in: [packages/security/src/secrets/stores/env.ts:157](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L157)

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

Defined in: [packages/security/src/secrets/stores/env.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L77)

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

Defined in: [packages/security/src/secrets/stores/env.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/stores/env.ts#L89)

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
