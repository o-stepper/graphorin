[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RedactionOutput

# Interface: RedactionOutput

Defined in: [packages/core/src/contracts/redaction-validator.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L51)

Result of `RedactionValidator.validate(...)` - either the sanitized
payload (possibly equal to the input) or `null` if the value must be
dropped entirely.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matched"></a> `matched?` | `readonly` | readonly `string`[] | List of pattern names matched while validating. | [packages/core/src/contracts/redaction-validator.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L55) |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/core/src/contracts/redaction-validator.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L53) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | [packages/core/src/contracts/redaction-validator.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L52) |
