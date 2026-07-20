[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryStoreAdapter

# Interface: MemoryStoreAdapter

Defined in: packages/memory/src/internal/storage-adapter.ts:953

**`Stable`**

Composite shape every `@graphorin/memory` consumer must supply at
construction time. Mirrors the typed `MemoryStore` from
`@graphorin/core` but widens the per-tier sub-store types with the
optional embedding-aware extension methods.

Concrete adapters (most notably `@graphorin/store-sqlite`)
implement every member by construction; in-memory test doubles
implement the minimum and leave the optional members undefined.

## Extends

- `Omit`\&lt;[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md), `"session"` \| `"episodic"` \| `"semantic"` \| `"procedural"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflicts"></a> `conflicts?` | `readonly` | [`ConflictMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConflictMemoryStoreExt.md) | **`Stable`** Optional conflict audit + pending queue surface. Defined on the default `@graphorin/store-sqlite` adapter, omitted on the minimal in-memory test doubles. | - | packages/memory/src/internal/storage-adapter.ts:966 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md) | **`Stable`** Optional consolidator state + runs + DLQ surface. Defined on the default `@graphorin/store-sqlite` adapter; in-memory test doubles may opt in via the fixture. | - | packages/memory/src/internal/storage-adapter.ts:974 |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStoreExt`](/api/@graphorin/memory/interfaces/EpisodicMemoryStoreExt.md) | - | - | packages/memory/src/internal/storage-adapter.ts:956 |
| <a id="property-graph"></a> `graph?` | `readonly` | [`GraphMemoryStoreExt`](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md) | **`Stable`** Optional relation-graph surface. Defined on the default `@graphorin/store-sqlite` adapter; omitted ⇒ entity resolution on write is a no-op and `search({ expandHops })` skips expansion. | - | packages/memory/src/internal/storage-adapter.ts:990 |
| <a id="property-insights"></a> `insights?` | `readonly` | [`InsightMemoryStoreExt`](/api/@graphorin/memory/interfaces/InsightMemoryStoreExt.md) | **`Stable`** Optional reflection insight surface. Defined on the default `@graphorin/store-sqlite` adapter; omitted ⇒ reflection is a no-op and `InsightMemory` reads return empty. | - | packages/memory/src/internal/storage-adapter.ts:982 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStoreExt`](/api/@graphorin/memory/interfaces/ProceduralMemoryStoreExt.md) | - | - | packages/memory/src/internal/storage-adapter.ts:958 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStoreExt`](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md) & `Partial`\&lt;[`DecayMemoryStoreExt`](/api/@graphorin/memory/interfaces/DecayMemoryStoreExt.md)\&gt; | - | - | packages/memory/src/internal/storage-adapter.ts:957 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStoreExt`](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md) | - | - | packages/memory/src/internal/storage-adapter.ts:955 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | - | `Omit.shared` | [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts) |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | - | `Omit.working` | [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts) |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

```ts
Omit.close
```

***

### init()

```ts
init(): Promise<void>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

```ts
Omit.init
```
