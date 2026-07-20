[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / SpecSnapshot

# Interface: SpecSnapshot

Defined in: packages/skills/src/spec/index.ts:53

Top-level shape of the bundled snapshot.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-graphorinmapping"></a> `graphorinMapping` | `readonly` | `Readonly`\<`Record`\&lt;`string`, [`GraphorinMappingEntry`](/api/@graphorin/skills/spec/interfaces/GraphorinMappingEntry.md)\&gt;\> | packages/skills/src/spec/index.ts:59 |
| <a id="property-knownfields"></a> `knownFields` | `readonly` | `Readonly`\<`Record`\&lt;`string`, [`KnownFieldEntry`](/api/@graphorin/skills/spec/interfaces/KnownFieldEntry.md)\&gt;\> | packages/skills/src/spec/index.ts:58 |
| <a id="property-rationale"></a> `rationale?` | `readonly` | `string` | packages/skills/src/spec/index.ts:57 |
| <a id="property-snapshotdate"></a> `snapshotDate` | `readonly` | `string` | packages/skills/src/spec/index.ts:54 |
| <a id="property-speccommit"></a> `specCommit` | `readonly` | `string` \| `null` | packages/skills/src/spec/index.ts:56 |
| <a id="property-specsource"></a> `specSource` | `readonly` | `string` | packages/skills/src/spec/index.ts:55 |
