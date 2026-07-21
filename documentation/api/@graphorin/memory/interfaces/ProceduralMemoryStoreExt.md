[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ProceduralMemoryStoreExt

# Interface: ProceduralMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:775

**`Stable`**

Extension of the typed `ProceduralMemoryStore` with the optional
promotion helper that storage adapters may expose.

## Extends

- [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md)

## Methods

### add()

```ts
add(rule): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | [`Rule`](/api/@graphorin/core/interfaces/Rule.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md).[`add`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md#add)

***

### list()

```ts
list(scope): Promise<readonly Rule[]>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Rule`](/api/@graphorin/core/interfaces/Rule.md)[]\&gt;

#### Inherited from

[`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md).[`list`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md#list)

***

### recordSuccess()?

```ts
optional recordSuccess(id): Promise<number>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:807

Record one demonstrated successful reuse of a rule and return the
new counter value. Powers
promotion-by-demonstrated-success via
[ProceduralMemory.recordOutcome](/api/@graphorin/memory/classes/ProceduralMemory.md#recordoutcome). Optional - adapters without
the counter simply never auto-promote.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### remove()

```ts
remove(id, reason?): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md).[`remove`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md#remove)

***

### search()?

```ts
optional search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Rule>[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:795

Lexical runbook search over rule text (migration 028) - content
recall for "find the procedure for this task", as opposed to
predicate activation. Quarantined (unvalidated induced) procedures
are excluded unless the inspector opts in. Optional - adapters
without the index omit it and [ProceduralMemory.search](/api/@graphorin/memory/classes/ProceduralMemory.md#search) falls
back to an in-memory lexical scan over `list(...)`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts?` | \{ `includeQuarantined?`: `boolean`; `topK?`: `number`; \} |
| `opts.includeQuarantined?` | `boolean` |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md)\&gt;[]\>

***

### setStatus()?

```ts
optional setStatus(
   id, 
   status, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:781

Set a rule's retrieval-trust `status` - promote a quarantined (induced)
procedure into `activate()` or re-quarantine an active one, with a
`memory_history` audit row. Powers [ProceduralMemory.validate](/api/@graphorin/memory/classes/ProceduralMemory.md#validate).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `status` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
