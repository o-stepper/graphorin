[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / Trajectory

# Interface: Trajectory

Defined in: [packages/memory/src/consolidator/phases/induce.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L66)

The minimal trajectory an inducer needs: the goal, the ordered steps, and
whether the run succeeded. Induction fires on **success only** (AWM online
mode) - [runWorkflowInduction](/api/@graphorin/memory/functions/runWorkflowInduction.md) returns `null` for a failed run.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-goal"></a> `goal` | `readonly` | `string` | What the run set out to do (typically the first user message). | [packages/memory/src/consolidator/phases/induce.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L68) |
| <a id="property-steps"></a> `steps` | `readonly` | readonly [`TrajectoryStep`](/api/@graphorin/memory/interfaces/TrajectoryStep.md)[] | Ordered steps the agent took. | [packages/memory/src/consolidator/phases/induce.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L70) |
| <a id="property-succeeded"></a> `succeeded` | `readonly` | `boolean` | Whether the run succeeded - the induction gate. | [packages/memory/src/consolidator/phases/induce.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L72) |
