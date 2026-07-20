[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CuratedBlockSpec

# Interface: CuratedBlockSpec

Defined in: packages/memory/src/consolidator/phases/learned-context.ts:46

**`Stable`**

One curated-block declaration: the deep phase maintains
a rewrite pass per entry - `learnedContext: true` is sugar for
`[{ label: 'learned_context' }]`. `prompt` overrides the maintenance
system prompt (the default is a generic fold-the-evidence rewrite,
parameterised by the label); `maxChars` bounds the stored value.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | packages/memory/src/consolidator/phases/learned-context.ts:47 |
| <a id="property-maxchars"></a> `maxChars?` | `readonly` | `number` | packages/memory/src/consolidator/phases/learned-context.ts:49 |
| <a id="property-prompt"></a> `prompt?` | `readonly` | `string` | packages/memory/src/consolidator/phases/learned-context.ts:48 |
