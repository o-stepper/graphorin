[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryWhyRecall

# Interface: MemoryWhyRecall

Defined in: [packages/cli/src/commands/memory.ts:702](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L702)

A single decoded recall explanation surfaced by `graphorin memory why`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `number` | Span start time (unix nanos) of the recall. | [packages/cli/src/commands/memory.ts:705](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L705) |
| <a id="property-results"></a> `results` | `readonly` | readonly \{ `id`: `string`; `rank`: `number`; `score`: `number`; `signals`: `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\>; \}[] | - | [packages/cli/src/commands/memory.ts:706](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L706) |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:703](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L703) |
