[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / PricingCommonOptions

# Interface: PricingCommonOptions

Defined in: packages/cli/src/commands/pricing.ts:46

## Stable

## Extends

- `CommonOutputOptions`

## Extended by

- [`PricingDiffOptions`](/api/@graphorin/cli/interfaces/PricingDiffOptions.md)
- [`PricingLookupOptions`](/api/@graphorin/cli/interfaces/PricingLookupOptions.md)
- [`PricingMissingOptions`](/api/@graphorin/cli/interfaces/PricingMissingOptions.md)
- [`PricingRefreshOptions`](/api/@graphorin/cli/interfaces/PricingRefreshOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam — capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam — capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
