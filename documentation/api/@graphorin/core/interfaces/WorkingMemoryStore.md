[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkingMemoryStore

# Interface: WorkingMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:76

**`Stable`**

## Methods

### delete()

```ts
delete(
   scope, 
   label, 
reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:80

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(scope, label): Promise<Block | null>;
```

Defined in: packages/core/src/contracts/memory-store.ts:78

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md) \| `null`\&gt;

***

### list()

```ts
list(scope): Promise<readonly Block[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:77

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Block`](/api/@graphorin/core/interfaces/Block.md)[]\&gt;

***

### purge()?

```ts
optional purge(scope, label): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:89

Hard-delete a block row - no tombstone left behind.
`delete` stays the soft tombstone; `purge` is the GDPR path for
USER-scoped blocks (e.g. the `profile` projection), which the
session-delete cascade never reaches (`scope_session_id IS NULL`).
Optional-additive: adapters that do not implement it make
`WorkingMemory.purge` throw instead of silently soft-deleting.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### upsert()

```ts
upsert(scope, block): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:79

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `block` | [`Block`](/api/@graphorin/core/interfaces/Block.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
