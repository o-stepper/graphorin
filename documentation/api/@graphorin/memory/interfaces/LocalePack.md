[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LocalePack

# Interface: LocalePack

Defined in: packages/memory/src/conflict/locale-packs/types.ts:53

**`Stable`**

A `LocalePack` defines the regex sets Stage 3 and the predicate
verb set Stage 4 use to evaluate a candidate fact pair against the
existing conflicts.

The bundled English pack (`enLocalePack`) covers the most common
personal-assistant change signals (relocation / job change /
preference flip / relationship / health). Additional locales are
registered through [defineLocalePack](/api/@graphorin/memory/functions/defineLocalePack.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable lowercase identifier (`'en'`, `'fr'`, …). | packages/memory/src/conflict/locale-packs/types.ts:55 |
| <a id="property-negationmarkers"></a> `negationMarkers` | `readonly` | readonly [`LocalePatternEntry`](/api/@graphorin/memory/interfaces/LocalePatternEntry.md)[] | Patterns that negate the existing fact (treated as supersede in Stage 3). | packages/memory/src/conflict/locale-packs/types.ts:59 |
| <a id="property-predicatenormalisers"></a> `predicateNormalisers` | `readonly` | readonly `string`[] | Verbs (or verb particles) Stage 4 strips while normalising a predicate so e.g. `'lives in'` and `'living in'` collapse to the same key. Lowercase tokens. | packages/memory/src/conflict/locale-packs/types.ts:65 |
| <a id="property-subjectstopwords"></a> `subjectStopWords` | `readonly` | readonly `string`[] | Tokens dropped from the subject before comparison (`'a'`, `'the'`, …). | packages/memory/src/conflict/locale-packs/types.ts:67 |
| <a id="property-supersedemarkers"></a> `supersedeMarkers` | `readonly` | readonly [`LocalePatternEntry`](/api/@graphorin/memory/interfaces/LocalePatternEntry.md)[] | Patterns that explicitly mark the candidate as superseding the existing fact. | packages/memory/src/conflict/locale-packs/types.ts:57 |
