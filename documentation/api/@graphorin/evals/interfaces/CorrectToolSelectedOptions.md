[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / CorrectToolSelectedOptions

# Interface: CorrectToolSelectedOptions

Defined in: packages/evals/src/scorers/trajectory/correct-tool-selected.ts:14

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected` | `readonly` | `string` \| readonly `string`[] | The tool name (or ordered sequence of names) the harness should call. | packages/evals/src/scorers/trajectory/correct-tool-selected.ts:16 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | packages/evals/src/scorers/trajectory/correct-tool-selected.ts:20 |
| <a id="property-requireorder"></a> `requireOrder?` | `readonly` | `boolean` | When `true`, the expected names must appear in order. Default `false`. | packages/evals/src/scorers/trajectory/correct-tool-selected.ts:18 |
