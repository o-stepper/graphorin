[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / FrontmatterDiagnostic

# Interface: FrontmatterDiagnostic

Defined in: [packages/skills/src/types/index.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L151)

Diagnostic record produced by the frontmatter validator. Carries a
structured `kind` so the loader can surface the diagnostic on a
trace span / audit emitter without re-parsing the human message.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-field"></a> `field` | `readonly` | `string` | [packages/skills/src/types/index.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L163) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | [packages/skills/src/types/index.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L166) |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"conflict"` \| `"experimental-field"` \| `"unknown-field"` \| `"spec-newer-than-loader"` \| `"spec-older-than-loader"` \| `"unsupported-frontmatter"` \| `"invalid-field-type"` \| `"missing-required-field"` \| `"untrusted-handoff-filter-required"` \| `"invalid-runtime-compat"` | [packages/skills/src/types/index.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L152) |
| <a id="property-message"></a> `message` | `readonly` | `string` | [packages/skills/src/types/index.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L165) |
| <a id="property-severity"></a> `severity` | `readonly` | `"warn"` \| `"error"` \| `"info"` | [packages/skills/src/types/index.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L164) |
