[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionInput

# Interface: RedactionInput

Defined in: [packages/core/dist/contracts/redaction-validator.d.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L33)

Input handed to `RedactionValidator.validate(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-context"></a> `context?` | `readonly` | \{ `attribute?`: `string`; `origin?`: `string`; `spanType?`: `string`; \} | Optional context describing where the value originated. | [packages/core/dist/contracts/redaction-validator.d.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L38) |
| `context.attribute?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L39) |
| `context.origin?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L41) |
| `context.spanType?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L40) |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Tier declared by the upstream caller for this value. | [packages/core/dist/contracts/redaction-validator.d.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L36) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | [packages/core/dist/contracts/redaction-validator.d.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts#L34) |
