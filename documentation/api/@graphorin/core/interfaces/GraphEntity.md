[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / GraphEntity

# Interface: GraphEntity

Defined in: packages/core/src/types/memory.ts:307

Canonical entity in the lightweight in-SQLite relation graph (P2-1).
The entity resolver (`@graphorin/memory`) deduplicates the raw
`subject`/`object` strings on facts into canonical entities — merging
aliases ("Anna", "Anna S.", "my sister") via lexical + embedding
similarity (with optional LLM adjudication) — so multi-hop recall can
traverse relationships instead of fragmenting them.

Merges are **append-only and reversible**: a merged entity is never
deleted — its [GraphEntity.mergedInto](/api/@graphorin/core/interfaces/GraphEntity.md#property-mergedinto) points at the surviving
canonical entity, every merge / unmerge is recorded in an audit
ledger, and `mergedInto` is single-level (it always points directly at
a root), so `mergedInto ?? id` is the canonical id.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/types/memory.ts:321 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/memory.ts:308 |
| <a id="property-mergedinto"></a> `mergedInto?` | `readonly` | `string` | Canonical pointer. `undefined` ⇒ this entity is itself a root. Otherwise it is the id of the surviving entity this one was merged into; single-level by construction, so `mergedInto ?? id` resolves the canonical id without a recursive walk. | packages/core/src/types/memory.ts:320 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Display name as first observed (the surface form that minted it). | packages/core/src/types/memory.ts:311 |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | Case/space-folded key used for lexical dedup + the canonical unique index. | packages/core/src/types/memory.ts:313 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:322 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | packages/core/src/types/memory.ts:309 |
