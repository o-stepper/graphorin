[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryWhyRecall

# Interface: MemoryWhyRecall

Defined in: packages/cli/src/commands/memory.ts:568

A single decoded recall explanation surfaced by `graphorin memory why`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `number` | Span start time (unix nanos) of the recall. | packages/cli/src/commands/memory.ts:571 |
| <a id="property-results"></a> `results` | `readonly` | readonly \{ `id`: `string`; `rank`: `number`; `score`: `number`; `signals`: `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\>; \}[] | - | packages/cli/src/commands/memory.ts:572 |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:569 |
