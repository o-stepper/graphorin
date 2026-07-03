[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryStore

# Interface: MemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:24

Persistent storage interface for the six memory tiers. Implementations
live in the storage adapter packages (`@graphorin/store-sqlite` is the
default).

Sub-namespaces map 1:1 to the six tiers so each implementation can
pick its own physical layout (one big table, six tables, mixed) while
preserving append-only semantics — soft-delete only.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md) | packages/core/src/contracts/memory-store.ts:27 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md) | packages/core/src/contracts/memory-store.ts:29 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md) | packages/core/src/contracts/memory-store.ts:28 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md) | packages/core/src/contracts/memory-store.ts:26 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | packages/core/src/contracts/memory-store.ts:30 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | packages/core/src/contracts/memory-store.ts:25 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:35

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:33

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
