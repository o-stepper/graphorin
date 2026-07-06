[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RedactionInput

# Interface: RedactionInput

Defined in: [packages/core/src/contracts/redaction-validator.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L32)

Input handed to `RedactionValidator.validate(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-context"></a> `context?` | `readonly` | \{ `attribute?`: `string`; `origin?`: `string`; `spanType?`: `string`; \} | Optional context describing where the value originated. | [packages/core/src/contracts/redaction-validator.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L37) |
| `context.attribute?` | `readonly` | `string` | - | [packages/core/src/contracts/redaction-validator.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L38) |
| `context.origin?` | `readonly` | `string` | - | [packages/core/src/contracts/redaction-validator.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L40) |
| `context.spanType?` | `readonly` | `string` | - | [packages/core/src/contracts/redaction-validator.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L39) |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Tier declared by the upstream caller for this value. | [packages/core/src/contracts/redaction-validator.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L35) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | [packages/core/src/contracts/redaction-validator.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/redaction-validator.ts#L33) |
