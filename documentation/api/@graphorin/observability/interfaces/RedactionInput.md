[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionInput

# Interface: RedactionInput

Defined in: [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts)

**`Stable`**

Input handed to `RedactionValidator.validate(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-context"></a> `context?` | `readonly` | \{ `attribute?`: `string`; `origin?`: `string`; `spanType?`: `string`; \} | Optional context describing where the value originated. | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| `context.attribute?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| `context.origin?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| `context.spanType?` | `readonly` | `string` | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Tier declared by the upstream caller for this value. | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | [packages/core/dist/contracts/redaction-validator.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/redaction-validator.d.ts) |
