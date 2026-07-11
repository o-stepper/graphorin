[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryWhyRecall

# Interface: MemoryWhyRecall

Defined in: [packages/cli/src/commands/memory.ts:572](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L572)

A single decoded recall explanation surfaced by `graphorin memory why`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `number` | Span start time (unix nanos) of the recall. | [packages/cli/src/commands/memory.ts:575](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L575) |
| <a id="property-results"></a> `results` | `readonly` | readonly \{ `id`: `string`; `rank`: `number`; `score`: `number`; `signals`: `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\>; \}[] | - | [packages/cli/src/commands/memory.ts:576](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L576) |
| <a id="property-spanid"></a> `spanId` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:573](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L573) |
