[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ClassifierRule

# Interface: ClassifierRule

Defined in: packages/provider/src/model-tier/classify.ts:25

Single entry in the classifier rule table.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-family"></a> `family` | `readonly` | `string` | Human-readable family label (`'anthropic-claude-haiku'`, …). | packages/provider/src/model-tier/classify.ts:29 |
| <a id="property-pattern"></a> `pattern` | `readonly` | `RegExp` | - | packages/provider/src/model-tier/classify.ts:27 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | - | packages/provider/src/model-tier/classify.ts:26 |
