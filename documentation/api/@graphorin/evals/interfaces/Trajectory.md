[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Trajectory

# Interface: Trajectory

Defined in: evals/src/scorers/trajectory/types.ts:38

The full record of a single harness attempt at a task.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-calls"></a> `calls` | `readonly` | readonly [`TrajectoryToolCall`](/api/@graphorin/evals/interfaces/TrajectoryToolCall.md)[] | - | evals/src/scorers/trajectory/types.ts:39 |
| <a id="property-finaloutput"></a> `finalOutput?` | `readonly` | `string` | The assistant's final text, when the run completed. | evals/src/scorers/trajectory/types.ts:43 |
| <a id="property-finalstate"></a> `finalState?` | `readonly` | `unknown` | Goal-state snapshot compared by [finalStateCorrect](/api/@graphorin/evals/functions/finalStateCorrect.md). | evals/src/scorers/trajectory/types.ts:41 |
