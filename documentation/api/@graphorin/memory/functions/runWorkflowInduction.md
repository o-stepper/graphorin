[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / runWorkflowInduction

# Function: runWorkflowInduction()

```ts
function runWorkflowInduction(
   trajectory, 
   inducer, 
   options?): Promise<
  | InducedProcedure
| null>;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:253

Pure orchestrator: induce a procedure from a trajectory.

**Gate — successful trajectories only** (AWM online mode): a failed /
aborted run, or one with no steps, yields `null` without calling the
inducer. Otherwise the inducer runs and the result is normalized.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `trajectory` | [`Trajectory`](/api/@graphorin/memory/interfaces/Trajectory.md) |
| `inducer` | [`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md) |
| `options` | [`WorkflowInductionOptions`](/api/@graphorin/memory/interfaces/WorkflowInductionOptions.md) |

## Returns

`Promise`\<
  \| [`InducedProcedure`](/api/@graphorin/memory/interfaces/InducedProcedure.md)
  \| `null`\>
