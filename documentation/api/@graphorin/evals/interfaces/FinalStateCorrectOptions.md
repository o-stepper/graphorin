[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / FinalStateCorrectOptions

# Interface: FinalStateCorrectOptions

Defined in: [packages/evals/src/scorers/trajectory/final-state-correct.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/final-state-correct.ts#L16)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected?` | `readonly` | `unknown` | Expected goal state, compared by deep-equality. Provide this or `matches`. | [packages/evals/src/scorers/trajectory/final-state-correct.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/final-state-correct.ts#L18) |
| <a id="property-matches"></a> `matches?` | `readonly` | (`finalState`) => `boolean` | Custom goal predicate, evaluated against the (path-resolved) state. | [packages/evals/src/scorers/trajectory/final-state-correct.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/final-state-correct.ts#L22) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | [packages/evals/src/scorers/trajectory/final-state-correct.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/final-state-correct.ts#L24) |
| <a id="property-path"></a> `path?` | `readonly` | `string` | Dot-path into `finalState` to compare instead of the whole snapshot. | [packages/evals/src/scorers/trajectory/final-state-correct.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/final-state-correct.ts#L20) |
