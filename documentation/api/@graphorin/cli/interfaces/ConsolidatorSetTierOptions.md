[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ConsolidatorSetTierOptions

# Interface: ConsolidatorSetTierOptions

Defined in: packages/cli/src/commands/consolidator.ts:129

**`Stable`**

## Extends

- [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md#property-config) | packages/cli/src/commands/consolidator.ts:48 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`ConsolidatorCommonOptions`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | - | packages/cli/src/commands/consolidator.ts:130 |
