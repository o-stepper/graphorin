[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LocaleMatch

# Interface: LocaleMatch

Defined in: packages/memory/src/conflict/locale-packs/types.ts:77

**`Stable`**

Outcome of a single locale-pack regex evaluation. Returned by
`evaluateMarkers(...)` so the pipeline can propagate the matched
marker into the audit row's `reason` field.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | packages/memory/src/conflict/locale-packs/types.ts:80 |
| <a id="property-excerpt"></a> `excerpt?` | `readonly` | `string` | packages/memory/src/conflict/locale-packs/types.ts:81 |
| <a id="property-kind"></a> `kind?` | `readonly` | [`LocaleSupersedeKind`](/api/@graphorin/memory/type-aliases/LocaleSupersedeKind.md) | packages/memory/src/conflict/locale-packs/types.ts:79 |
| <a id="property-matched"></a> `matched` | `readonly` | `boolean` | packages/memory/src/conflict/locale-packs/types.ts:78 |
