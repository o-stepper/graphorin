[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LocalePatternEntry

# Interface: LocalePatternEntry

Defined in: packages/memory/src/conflict/locale-packs/types.ts:31

**`Stable`**

Single regex pattern bundled inside a `LocalePack`. The pipeline
applies the regex to the fact body in case-insensitive mode unless
the pattern was constructed with explicit flags.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | Optional confidence ∈ `[0, 1]` surfaced through the audit row's `reason` field. Defaults to `0.8`. | packages/memory/src/conflict/locale-packs/types.ts:38 |
| <a id="property-kind"></a> `kind?` | `readonly` | [`LocaleSupersedeKind`](/api/@graphorin/memory/type-aliases/LocaleSupersedeKind.md) | - | packages/memory/src/conflict/locale-packs/types.ts:33 |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | - | packages/memory/src/conflict/locale-packs/types.ts:32 |
