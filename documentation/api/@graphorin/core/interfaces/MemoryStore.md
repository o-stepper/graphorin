[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryStore

# Interface: MemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:38

**`Stable`**

Persistent storage interface for the six memory tiers. Implementations
live in the storage adapter packages (`@graphorin/store-sqlite` is the
default).

Sub-namespaces map 1:1 to the six tiers so each implementation can
pick its own physical layout (one big table, six tables, mixed) while
preserving append-only semantics - soft-delete only.

**Baseline vs full adapter.** This interface is the MINIMUM a
third-party adapter must implement; `@graphorin/memory` accepts it and
degrades gracefully (vector search, decay, consolidation, insights,
graph expansion, conflict audit switch off where the surface is
absent). Full feature parity with `@graphorin/store-sqlite` (asOf
reads, vector KNN, decay signals, insights, entity graph, conflicts,
consolidator state/DLQ) is described by `MemoryStoreAdapter` and the
`*MemoryStoreExt` interfaces exported from the root of
`@graphorin/memory`. Every Ext addition over the six tier namespaces
is optional BY CONTRACT - a type test in `@graphorin/memory` pins
`MemoryStore extends MemoryStoreAdapter`, so a core-only adapter can
never stop compiling.

## Extended by

- [`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md) | packages/core/src/contracts/memory-store.ts:41 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md) | packages/core/src/contracts/memory-store.ts:43 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md) | packages/core/src/contracts/memory-store.ts:42 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md) | packages/core/src/contracts/memory-store.ts:40 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | packages/core/src/contracts/memory-store.ts:44 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | packages/core/src/contracts/memory-store.ts:39 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:49

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:47

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
