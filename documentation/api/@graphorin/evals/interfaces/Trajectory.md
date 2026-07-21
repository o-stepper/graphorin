[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Trajectory

# Interface: Trajectory

Defined in: packages/evals/src/scorers/trajectory/types.ts:38

**`Stable`**

The full record of a single harness attempt at a task.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-calls"></a> `calls` | `readonly` | readonly [`TrajectoryToolCall`](/api/@graphorin/evals/interfaces/TrajectoryToolCall.md)[] | - | packages/evals/src/scorers/trajectory/types.ts:39 |
| <a id="property-finaloutput"></a> `finalOutput?` | `readonly` | `string` | The assistant's final text, when the run completed. | packages/evals/src/scorers/trajectory/types.ts:43 |
| <a id="property-finalstate"></a> `finalState?` | `readonly` | `unknown` | Goal-state snapshot compared by [finalStateCorrect](/api/@graphorin/evals/functions/finalStateCorrect.md). | packages/evals/src/scorers/trajectory/types.ts:41 |
