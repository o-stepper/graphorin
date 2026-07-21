[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / ArgumentValidityOptions

# Interface: ArgumentValidityOptions

Defined in: packages/evals/src/scorers/trajectory/argument-validity.ts:25

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | packages/evals/src/scorers/trajectory/argument-validity.ts:29 |
| <a id="property-tools"></a> `tools` | `readonly` | readonly \{ `inputSchema`: [`SchemaLike`](/api/@graphorin/evals/scorers/interfaces/SchemaLike.md); `name`: `string`; \}[] | The tools whose `inputSchema` is used to validate matching calls. | packages/evals/src/scorers/trajectory/argument-validity.ts:27 |
