[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemorySecretsStore

# Class: MemorySecretsStore

Defined in: packages/security/src/secrets/stores/memory.ts:22

In-memory `SecretsStore` for tests. Refuses to start in `production`
mode unless explicitly opted in.

## Stable

## Implements

- [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)

## Constructors

### Constructor

```ts
new MemorySecretsStore(opts?): MemorySecretsStore;
```

Defined in: packages/security/src/secrets/stores/memory.ts:27

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `forceProduction?`: `boolean`; \} |
| `opts.forceProduction?` | `boolean` |

#### Returns

`MemorySecretsStore`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"memory"` | Stable identifier - surfaced in `getSecretsStoreStatus()`. | packages/security/src/secrets/stores/memory.ts:24 |

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

Defined in: packages/security/src/secrets/stores/memory.ts:34

Whether this store has any keys at all.

##### Returns

`number`

## Methods

### delete()

```ts
delete(key, scope?): Promise<void>;
```

Defined in: packages/security/src/secrets/stores/memory.ts:85

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`delete`](/api/@graphorin/core/interfaces/SecretsStore.md#delete)

***

### get()

```ts
get(key, scope?): Promise<SecretValue | null>;
```

Defined in: packages/security/src/secrets/stores/memory.ts:38

Returns the secret if it exists, `null` otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) \| `null`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`get`](/api/@graphorin/core/interfaces/SecretsStore.md#get)

***

### list()

```ts
list(scope?): Promise<readonly SecretMetadata[]>;
```

Defined in: packages/security/src/secrets/stores/memory.ts:91

Returns metadata about every key - never the values themselves.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`SecretMetadata`](/api/@graphorin/core/interfaces/SecretMetadata.md)[]\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`list`](/api/@graphorin/core/interfaces/SecretsStore.md#list)

***

### require()

```ts
require(key, scope?): Promise<SecretValue>;
```

Defined in: packages/security/src/secrets/stores/memory.ts:53

Returns the secret or throws. Implementations enforce the per-tool
`secretsAllowed` ACL: if the current tool context disallows `key`,
throw `SecretAccessDeniedError`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

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

Defined in: packages/security/src/secrets/stores/memory.ts:61

Persist a secret. Implementations auto-wrap a plain string into a
`SecretValue` so callers don't have to.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | \| `string` \| [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) |
| `opts` | [`SecretsSetOptions`](/api/@graphorin/core/interfaces/SecretsSetOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md).[`set`](/api/@graphorin/core/interfaces/SecretsStore.md#set)
