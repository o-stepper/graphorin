[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RedactionInput

# Interface: RedactionInput

Defined in: packages/core/src/contracts/redaction-validator.ts:32

**`Stable`**

Input handed to `RedactionValidator.validate(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-context"></a> `context?` | `readonly` | \{ `attribute?`: `string`; `origin?`: `string`; `spanType?`: `string`; \} | Optional context describing where the value originated. | packages/core/src/contracts/redaction-validator.ts:37 |
| `context.attribute?` | `readonly` | `string` | - | packages/core/src/contracts/redaction-validator.ts:38 |
| `context.origin?` | `readonly` | `string` | - | packages/core/src/contracts/redaction-validator.ts:40 |
| `context.spanType?` | `readonly` | `string` | - | packages/core/src/contracts/redaction-validator.ts:39 |
| <a id="property-tier"></a> `tier` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Tier declared by the upstream caller for this value. | packages/core/src/contracts/redaction-validator.ts:35 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | packages/core/src/contracts/redaction-validator.ts:33 |
