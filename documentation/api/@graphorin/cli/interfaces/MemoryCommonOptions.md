[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryCommonOptions

# Interface: MemoryCommonOptions

Defined in: [packages/cli/src/commands/memory.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L38)

## Stable

## Extends

- `CommonOutputOptions`

## Extended by

- [`MemoryActivityOptions`](/api/@graphorin/cli/interfaces/MemoryActivityOptions.md)
- [`MemoryInspectOptions`](/api/@graphorin/cli/interfaces/MemoryInspectOptions.md)
- [`MemoryMigrateOptions`](/api/@graphorin/cli/interfaces/MemoryMigrateOptions.md)
- [`MemoryPruneHistoryOptions`](/api/@graphorin/cli/interfaces/MemoryPruneHistoryOptions.md)
- [`MemoryReviewOptions`](/api/@graphorin/cli/interfaces/MemoryReviewOptions.md)
- [`MemoryWhyOptions`](/api/@graphorin/cli/interfaces/MemoryWhyOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | [packages/cli/src/commands/memory.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L39) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
