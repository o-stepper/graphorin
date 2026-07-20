[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / PricingMissingOptions

# Interface: PricingMissingOptions

Defined in: packages/cli/src/commands/pricing.ts:233

**`Stable`**

## Extends

- [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-spans"></a> `spans` | `readonly` | `string` | Path to a JSON file containing an array of trace spans (each with an `attributes` map). Output of `graphorin traces export` (Phase 15) is the canonical source. | - | packages/cli/src/commands/pricing.ts:239 |
