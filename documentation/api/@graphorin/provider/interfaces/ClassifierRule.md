[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ClassifierRule

# Interface: ClassifierRule

Defined in: [packages/provider/src/model-tier/classify.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/model-tier/classify.ts#L26)

Single entry in the classifier rule table.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-family"></a> `family` | `readonly` | `string` | Human-readable family label (`'anthropic-claude-haiku'`, …). | [packages/provider/src/model-tier/classify.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/model-tier/classify.ts#L30) |
| <a id="property-pattern"></a> `pattern` | `readonly` | `RegExp` | - | [packages/provider/src/model-tier/classify.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/model-tier/classify.ts#L28) |
| <a id="property-tier"></a> `tier` | `readonly` | [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | - | [packages/provider/src/model-tier/classify.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/model-tier/classify.ts#L27) |
