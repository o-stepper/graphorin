[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RedactionOutput

# Interface: RedactionOutput

Defined in: packages/core/src/contracts/redaction-validator.ts:51

**`Stable`**

Result of `RedactionValidator.validate(...)` - either the sanitized
payload (possibly equal to the input) or `null` if the value must be
dropped entirely.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matched"></a> `matched?` | `readonly` | readonly `string`[] | List of pattern names matched while validating. | packages/core/src/contracts/redaction-validator.ts:55 |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/core/src/contracts/redaction-validator.ts:53 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | packages/core/src/contracts/redaction-validator.ts:52 |
