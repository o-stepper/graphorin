[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ValidationConfig

# Interface: ValidationConfig

Defined in: [packages/observability/src/redaction/config.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L17)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-disabledpatterns"></a> `disabledPatterns?` | `readonly` | readonly `string`[] | Per-name deny-list. | [packages/observability/src/redaction/config.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L36) |
| <a id="property-enabledpatterns"></a> `enabledPatterns?` | `readonly` | readonly `string`[] | Per-name allow-list. | [packages/observability/src/redaction/config.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L34) |
| <a id="property-failonunredactedsensitive"></a> `failOnUnredactedSensitive?` | `readonly` | `boolean` | When `true`, the validator throws on dropped values instead of silently dropping + counting. Use in tests; production should keep the default. **Default** `false` | [packages/observability/src/redaction/config.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L27) |
| <a id="property-mintier"></a> `minTier?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Lowest tier that may pass through the validator. | [packages/observability/src/redaction/config.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L19) |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`RedactionPattern`](/api/@graphorin/observability/redaction/patterns/interfaces/RedactionPattern.md)[] | Custom pattern catalogue. Defaults to the 14 default-on built-in patterns. | [packages/observability/src/redaction/config.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L32) |
