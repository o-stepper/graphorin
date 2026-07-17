[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SessionScopedPurge

# Interface: SessionScopedPurge

Defined in: [packages/store-sqlite/src/session-store.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L415)

One entry of the session-content purge registry: which table holds
session-scoped rows, which column scopes them, and which sidecars
(FTS shadow, per-embedder vec0 tables, FK-referencing tables,
memory-history value scrub) must go with them.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fts"></a> `fts?` | `readonly` | `string` | FTS5 shadow table joined by rowid, when the table has one. | [packages/store-sqlite/src/session-store.ts:421](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L421) |
| <a id="property-history"></a> `history?` | `readonly` | \{ `kind`: `string`; `textColumn`: `string`; `valueMatch`: `boolean`; \} | Scrub `memory_history` values for the deleted rows (store-04 parity). `valueMatch` additionally clears history rows whose values equal the deleted row's text (the SUPERSEDE shape). | [packages/store-sqlite/src/session-store.ts:431](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L431) |
| `history.kind` | `readonly` | `string` | - | [packages/store-sqlite/src/session-store.ts:432](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L432) |
| `history.textColumn` | `readonly` | `string` | - | [packages/store-sqlite/src/session-store.ts:433](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L433) |
| `history.valueMatch` | `readonly` | `boolean` | - | [packages/store-sqlite/src/session-store.ts:434](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L434) |
| <a id="property-refs"></a> `refs?` | `readonly` | readonly \{ `column`: `string`; `table`: `string`; \}[] | Tables referencing the base rows - cleared BEFORE the base rows. | [packages/store-sqlite/src/session-store.ts:425](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L425) |
| <a id="property-sessioncolumn"></a> `sessionColumn` | `readonly` | `"scope_session_id"` \| `"session_id"` | Column carrying the session id. | [packages/store-sqlite/src/session-store.ts:419](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L419) |
| <a id="property-table"></a> `table` | `readonly` | `string` | Base table holding the session-scoped rows. | [packages/store-sqlite/src/session-store.ts:417](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L417) |
| <a id="property-vec"></a> `vec?` | `readonly` | \{ `idColumn`: `string`; `prefix`: `string`; \} | Per-embedder vec0 sidecar family (name prefix + id column). | [packages/store-sqlite/src/session-store.ts:423](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L423) |
| `vec.idColumn` | `readonly` | `string` | - | [packages/store-sqlite/src/session-store.ts:423](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L423) |
| `vec.prefix` | `readonly` | `string` | - | [packages/store-sqlite/src/session-store.ts:423](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L423) |
