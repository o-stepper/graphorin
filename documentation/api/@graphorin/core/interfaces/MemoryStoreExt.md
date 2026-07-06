[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryStoreExt

# Interface: MemoryStoreExt

Defined in: packages/core/src/contracts/memory-store.ts:60

Maintenance extension over [MemoryStore](/api/@graphorin/core/interfaces/MemoryStore.md) (W-066), mirroring
the `SessionStoreExt` precedent: capabilities the sqlite adapter
guarantees but a custom `MemoryStore` is not obliged to implement.
The base contract is unchanged - existing implementations keep
compiling.

## Stable

## Extends

- [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`episodic`](/api/@graphorin/core/interfaces/MemoryStore.md#property-episodic) | packages/core/src/contracts/memory-store.ts:40 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`procedural`](/api/@graphorin/core/interfaces/MemoryStore.md#property-procedural) | packages/core/src/contracts/memory-store.ts:42 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`semantic`](/api/@graphorin/core/interfaces/MemoryStore.md#property-semantic) | packages/core/src/contracts/memory-store.ts:41 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`session`](/api/@graphorin/core/interfaces/MemoryStore.md#property-session) | packages/core/src/contracts/memory-store.ts:39 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`shared`](/api/@graphorin/core/interfaces/MemoryStore.md#property-shared) | packages/core/src/contracts/memory-store.ts:43 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`working`](/api/@graphorin/core/interfaces/MemoryStore.md#property-working) | packages/core/src/contracts/memory-store.ts:38 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:48

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`close`](/api/@graphorin/core/interfaces/MemoryStore.md#close)

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:46

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`init`](/api/@graphorin/core/interfaces/MemoryStore.md#init)

***

### pruneHistory()

```ts
pruneHistory(olderThanMs): Promise<number>;
```

Defined in: packages/core/src/contracts/memory-store.ts:71

Delete `memory_history` rows older than the given AGE in
milliseconds. The argument is an AGE (the implementation computes
`cutoff = now - olderThanMs`), never an epoch cutoff - passing an
epoch value would compute a nonsense cutoff far in the past and
silently prune nothing. Returns the number of rows removed.
History grows by design (every supersede / quarantine transition
appends) and `purge()` already scrubs sensitive text; this is the
storage-cost hygiene lever - nothing prunes automatically.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `olderThanMs` | `number` |

#### Returns

`Promise`\<`number`\>
