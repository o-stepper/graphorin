[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / PricingRefreshOptions

# Interface: PricingRefreshOptions

Defined in: [packages/cli/src/commands/pricing.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L75)

## Stable

## Extends

- [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Test seam - inject a fetch implementation. | - | [packages/cli/src/commands/pricing.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L88) |
| <a id="property-format"></a> `format?` | `readonly` | `"graphorin"` \| `"auto"` \| `"genai-prices"` | W-097: accepted body format - `auto` (default) tries the native shape then auto-detects the `@pydantic/genai-prices` dataset. | - | [packages/cli/src/commands/pricing.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L86) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-out"></a> `out?` | `readonly` | `string` | Optional path to write the refreshed snapshot to. When omitted the CLI prints a status summary only; `--out` triggers a JSON write. | - | [packages/cli/src/commands/pricing.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L81) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`PricingCommonOptions`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/PricingCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-url"></a> `url` | `readonly` | `string` | - | - | [packages/cli/src/commands/pricing.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L76) |
