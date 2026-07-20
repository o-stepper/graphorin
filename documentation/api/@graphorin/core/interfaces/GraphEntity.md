[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / GraphEntity

# Interface: GraphEntity

Defined in: packages/core/src/types/memory.ts:353

**`Stable`**

Canonical entity in the lightweight in-SQLite relation graph.
The entity resolver (`@graphorin/memory`) deduplicates the raw
`subject`/`object` strings on facts into canonical entities - merging
aliases ("Anna", "Anna S.", "my sister") via lexical + embedding
similarity (with optional LLM adjudication) - so multi-hop recall can
traverse relationships instead of fragmenting them.

Merges are **append-only and reversible**: a merged entity is never
deleted - its [GraphEntity.mergedInto](/api/@graphorin/core/interfaces/GraphEntity.md#property-mergedinto) points at the surviving
canonical entity, every merge / unmerge is recorded in an audit
ledger, and `mergedInto` is single-level (it always points directly at
a root), so `mergedInto ?? id` is the canonical id.

Core defines only the record shape; the storage surface for the graph
(upsert / link / merge / one-hop expansion) is NOT part of the
baseline [MemoryStore](/api/@graphorin/core/interfaces/MemoryStore.md) contract - it lives in the optional
`GraphMemoryStoreExt` exported from `@graphorin/memory`.
Adapters without it simply have no relation graph.

## Extended by

- [`EntityWithEmbedding`](/api/@graphorin/memory/interfaces/EntityWithEmbedding.md)
- [`SqliteEntityWithEmbedding`](/api/@graphorin/store-sqlite/interfaces/SqliteEntityWithEmbedding.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/types/memory.ts:367 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/memory.ts:354 |
| <a id="property-mergedinto"></a> `mergedInto?` | `readonly` | `string` | Canonical pointer. `undefined` ⇒ this entity is itself a root. Otherwise it is the id of the surviving entity this one was merged into; single-level by construction, so `mergedInto ?? id` resolves the canonical id without a recursive walk. | packages/core/src/types/memory.ts:366 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Display name as first observed (the surface form that minted it). | packages/core/src/types/memory.ts:357 |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | Case/space-folded key used for lexical dedup + the canonical unique index. | packages/core/src/types/memory.ts:359 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:368 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | packages/core/src/types/memory.ts:355 |
