[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / ArgumentValidityOptions

# Interface: ArgumentValidityOptions

Defined in: packages/evals/src/scorers/trajectory/argument-validity.ts:19

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | packages/evals/src/scorers/trajectory/argument-validity.ts:23 |
| <a id="property-tools"></a> `tools` | `readonly` | readonly \{ `inputSchema`: `SchemaLike`; `name`: `string`; \}[] | The tools whose `inputSchema` is used to validate matching calls. | packages/evals/src/scorers/trajectory/argument-validity.ts:21 |
