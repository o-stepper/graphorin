[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionValidatorOptions

# Interface: RedactionValidatorOptions

Defined in: packages/observability/src/redaction/types.ts:66

Configuration shape for [createRedactionValidator](/api/@graphorin/observability/functions/createRedactionValidator.md).

## Stable

## Extended by

- [`WithValidationOptions`](/api/@graphorin/observability/interfaces/WithValidationOptions.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-customvalidator"></a> `customValidator?` | `readonly` | (`input`) => \| [`RedactionOutput`](/api/@graphorin/observability/interfaces/RedactionOutput.md) \| `null` | Optional pluggable additional check, fired after the pattern scan succeeds. The callback returns `null` to drop the value or a sanitized [RedactionOutput](/api/@graphorin/observability/interfaces/RedactionOutput.md) to forward. | packages/observability/src/redaction/types.ts:103 |
| <a id="property-disabledpatterns"></a> `disabledPatterns?` | `readonly` | readonly `string`[] | Per-name deny-list. Patterns listed here are skipped entirely. Applied **after** `enabledPatterns`. | packages/observability/src/redaction/types.ts:92 |
| <a id="property-enabledpatterns"></a> `enabledPatterns?` | `readonly` | readonly `string`[] | Per-name allow-list. When provided, only patterns whose `name` appears here are evaluated. Empty array disables all pattern matching (tier filtering still applies). | packages/observability/src/redaction/types.ts:87 |
| <a id="property-failonunredactedsensitive"></a> `failOnUnredactedSensitive?` | `readonly` | `boolean` | When `true`, throw a [RedactionValidationError](/api/@graphorin/observability/classes/RedactionValidationError.md) on any drop. Useful in tests; production should keep this off so the validator silently drops + counts. | packages/observability/src/redaction/types.ts:76 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `validator.id`. Defaults to `'default'`. | packages/observability/src/redaction/types.ts:68 |
| <a id="property-mintier"></a> `minTier?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Lowest tier that may pass through the validator. Default: `'public'`. | packages/observability/src/redaction/types.ts:70 |
| <a id="property-onviolation"></a> `onViolation?` | `readonly` | [`RedactionViolationCallback`](/api/@graphorin/observability/type-aliases/RedactionViolationCallback.md) | Optional sink invoked on every violation. Receives only sanitized data; never receives secret values. | packages/observability/src/redaction/types.ts:97 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`RedactionPattern`](/api/@graphorin/observability/redaction/patterns/interfaces/RedactionPattern.md)[] | Pattern catalogue. Defaults to the 14 built-in default-on patterns. Custom patterns can extend or replace this list. | packages/observability/src/redaction/types.ts:81 |
