[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CuratedBlockSpec

# Interface: CuratedBlockSpec

Defined in: [packages/memory/src/consolidator/phases/learned-context.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/learned-context.ts#L46)

One curated-block declaration (wave-D D3): the deep phase maintains
a rewrite pass per entry - `learnedContext: true` is sugar for
`[{ label: 'learned_context' }]`. `prompt` overrides the maintenance
system prompt (the default is a generic fold-the-evidence rewrite,
parameterised by the label); `maxChars` bounds the stored value.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | [packages/memory/src/consolidator/phases/learned-context.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/learned-context.ts#L47) |
| <a id="property-maxchars"></a> `maxChars?` | `readonly` | `number` | [packages/memory/src/consolidator/phases/learned-context.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/learned-context.ts#L49) |
| <a id="property-prompt"></a> `prompt?` | `readonly` | `string` | [packages/memory/src/consolidator/phases/learned-context.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/learned-context.ts#L48) |
