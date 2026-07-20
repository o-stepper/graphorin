[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrationRow

# Interface: MigrationRow

Defined in: packages/memory/src/migration/embedder-migration.ts:152

**`Stable`**

Single row exposed to the migration runner. The runner re-embeds
`text` with the target embedder; the storage adapter is responsible
for committing the new vector + updating `embedder_id`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/migration/embedder-migration.ts:153 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/memory/src/migration/embedder-migration.ts:154 |
| <a id="property-write"></a> `write` | `readonly` | (`vector`) => `Promise`\&lt;`void`\&gt; | packages/memory/src/migration/embedder-migration.ts:155 |
