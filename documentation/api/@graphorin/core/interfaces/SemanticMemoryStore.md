[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SemanticMemoryStore

# Interface: SemanticMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:185

**`Stable`**

## Extended by

- [`SemanticMemoryStoreExt`](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md)

## Methods

### forget()

```ts
forget(
   id, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:200

Soft-delete a fact. When `scope` is supplied, adapters that
support tenant isolation MUST treat a fact outside the scope as a
deterministic no-op (0 rows changed) - defense in depth so a
leaked / cross-user id reaching a mutator cannot touch another
user's memory. Omitting `scope` preserves the historical unscoped
behaviour (trusted internal callers: consolidator, erasure
cascades). The parameter is additive - existing adapter
implementations with the narrower arity remain structurally
compatible.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### remember()

```ts
remember(fact): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:186

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:187

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

***

### supersede()

```ts
supersede(
   oldId, 
   newFact, 
reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:188

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `oldId` | `string` |
| `newFact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
