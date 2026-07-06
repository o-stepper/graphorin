[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryStoreAdapter

# Interface: MemoryStoreAdapter

Defined in: packages/memory/src/internal/storage-adapter.ts:873

Composite shape every `@graphorin/memory` consumer must supply at
construction time. Mirrors the typed `MemoryStore` from
`@graphorin/core` but widens the per-tier sub-store types with the
optional embedding-aware extension methods.

Concrete adapters (most notably `@graphorin/store-sqlite`)
implement every member by construction; in-memory test doubles
implement the minimum and leave the optional members undefined.

## Stable

## Extends

- `Omit`\&lt;[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md), `"session"` \| `"episodic"` \| `"semantic"` \| `"procedural"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflicts"></a> `conflicts?` | `readonly` | [`ConflictMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConflictMemoryStoreExt.md) | Optional conflict audit + pending queue surface. Defined on the default `@graphorin/store-sqlite` adapter, omitted on the minimal in-memory test doubles. **Stable** | - | packages/memory/src/internal/storage-adapter.ts:886 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorMemoryStoreExt`](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md) | Optional consolidator state + runs + DLQ surface. Defined on the default `@graphorin/store-sqlite` adapter; in-memory test doubles may opt in via the fixture. **Stable** | - | packages/memory/src/internal/storage-adapter.ts:894 |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStoreExt`](/api/@graphorin/memory/interfaces/EpisodicMemoryStoreExt.md) | - | - | packages/memory/src/internal/storage-adapter.ts:876 |
| <a id="property-graph"></a> `graph?` | `readonly` | `GraphMemoryStoreExt` | Optional relation-graph surface (P2-1). Defined on the default `@graphorin/store-sqlite` adapter; omitted ⇒ entity resolution on write is a no-op and `search({ expandHops })` skips expansion. **Stable** | - | packages/memory/src/internal/storage-adapter.ts:910 |
| <a id="property-insights"></a> `insights?` | `readonly` | [`InsightMemoryStoreExt`](/api/@graphorin/memory/interfaces/InsightMemoryStoreExt.md) | Optional reflection insight surface (P1-1). Defined on the default `@graphorin/store-sqlite` adapter; omitted ⇒ reflection is a no-op and `InsightMemory` reads return empty. **Stable** | - | packages/memory/src/internal/storage-adapter.ts:902 |
| <a id="property-procedural"></a> `procedural` | `readonly` | `ProceduralMemoryStoreExt` | - | - | packages/memory/src/internal/storage-adapter.ts:878 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStoreExt`](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md) & `Partial`\&lt;[`DecayMemoryStoreExt`](/api/@graphorin/memory/interfaces/DecayMemoryStoreExt.md)\&gt; | - | - | packages/memory/src/internal/storage-adapter.ts:877 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStoreExt`](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md) | - | - | packages/memory/src/internal/storage-adapter.ts:875 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | - | `Omit.shared` | packages/core/dist/contracts/memory-store.d.ts:24 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | - | `Omit.working` | packages/core/dist/contracts/memory-store.d.ts:19 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:28

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

Defined in: packages/core/dist/contracts/memory-store.d.ts:26

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

```ts
Omit.init
```
