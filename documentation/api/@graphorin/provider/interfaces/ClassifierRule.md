[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ClassifierRule

# Interface: ClassifierRule

Defined in: packages/provider/src/model-tier/classify.ts:26

**`Stable`**

Single entry in the classifier rule table.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-family"></a> `family` | `readonly` | `string` | Human-readable family label (`'anthropic-claude-haiku'`, …). | packages/provider/src/model-tier/classify.ts:30 |
| <a id="property-pattern"></a> `pattern` | `readonly` | `RegExp` | - | packages/provider/src/model-tier/classify.ts:28 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | - | packages/provider/src/model-tier/classify.ts:27 |
