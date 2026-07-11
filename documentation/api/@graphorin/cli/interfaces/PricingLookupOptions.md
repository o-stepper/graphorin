[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / PricingLookupOptions

# Interface: PricingLookupOptions

Defined in: [packages/cli/src/commands/pricing.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L164)

## Stable

## Extends

- [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | - | [packages/cli/src/commands/pricing.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L166) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | - | - | [packages/cli/src/commands/pricing.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L165) |
| <a id="property-region"></a> `region?` | `readonly` | `string` | - | - | [packages/cli/src/commands/pricing.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L167) |
