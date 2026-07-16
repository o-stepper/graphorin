[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / ArgumentValidityOptions

# Interface: ArgumentValidityOptions

Defined in: [packages/evals/src/scorers/trajectory/argument-validity.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/argument-validity.ts#L19)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | [packages/evals/src/scorers/trajectory/argument-validity.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/argument-validity.ts#L23) |
| <a id="property-tools"></a> `tools` | `readonly` | readonly \{ `inputSchema`: `SchemaLike`; `name`: `string`; \}[] | The tools whose `inputSchema` is used to validate matching calls. | [packages/evals/src/scorers/trajectory/argument-validity.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/argument-validity.ts#L21) |
