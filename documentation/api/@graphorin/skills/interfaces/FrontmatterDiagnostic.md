[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / FrontmatterDiagnostic

# Interface: FrontmatterDiagnostic

Defined in: packages/skills/src/types/index.ts:140

Diagnostic record produced by the frontmatter validator. Carries a
structured `kind` so the loader can surface the diagnostic on a
trace span / audit emitter without re-parsing the human message.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-field"></a> `field` | `readonly` | `string` | packages/skills/src/types/index.ts:152 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | packages/skills/src/types/index.ts:155 |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"conflict"` \| `"experimental-field"` \| `"unknown-field"` \| `"spec-newer-than-loader"` \| `"spec-older-than-loader"` \| `"unsupported-frontmatter"` \| `"invalid-field-type"` \| `"missing-required-field"` \| `"untrusted-handoff-filter-required"` \| `"invalid-runtime-compat"` | packages/skills/src/types/index.ts:141 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/skills/src/types/index.ts:154 |
| <a id="property-severity"></a> `severity` | `readonly` | `"warn"` \| `"error"` \| `"info"` | packages/skills/src/types/index.ts:153 |
