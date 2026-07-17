[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionOutput

# Interface: RedactionOutput

Defined in: [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts)

Result of `RedactionValidator.validate(...)` - either the sanitized
payload (possibly equal to the input) or `null` if the value must be
dropped entirely.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matched"></a> `matched?` | `readonly` | readonly `string`[] | List of pattern names matched while validating. | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
