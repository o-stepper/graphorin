[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / WorkflowInducer

# Interface: WorkflowInducer

Defined in: packages/memory/src/consolidator/phases/induce.ts:106

**`Stable`**

Provider-agnostic seam: turn one successful trajectory into a procedure.
Returns `null` when nothing inducible (degraded provider, empty output) -
never throws.

## Methods

### induce()

```ts
induce(trajectory, options?): Promise<
  | InducedProcedure
| null>;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:107

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `trajectory` | [`Trajectory`](/api/@graphorin/memory/interfaces/Trajectory.md) |
| `options?` | [`WorkflowInductionOptions`](/api/@graphorin/memory/interfaces/WorkflowInductionOptions.md) |

#### Returns

`Promise`\<
  \| [`InducedProcedure`](/api/@graphorin/memory/interfaces/InducedProcedure.md)
  \| `null`\>
