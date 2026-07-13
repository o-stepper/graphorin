[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / evaluateMerge

# Function: evaluateMerge()

```ts
function evaluateMerge(perChild, cfg): MergeBiasDecision;
```

Defined in: [packages/agent/src/lateral-leak/merge-guard.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L120)

Evaluate whether the merge is biased - a child with
`sourceTrust < lowTrustThreshold` contributing more than
`maxLowTrustWeight` of the merged output.

Inputs are pre-computed per-child trust scores together with the
estimated contribution weights (token-count overlap between each
child's output and the merged output, normalized to sum to ~1.0).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `perChild` | readonly \{ `agentId`: `string`; `contributionWeight`: `number`; `sourceTrust`: `number`; \}[] |
| `cfg` | [`MergeGuardConfig`](/api/@graphorin/agent/interfaces/MergeGuardConfig.md) |

## Returns

[`MergeBiasDecision`](/api/@graphorin/agent/interfaces/MergeBiasDecision.md)

## Stable
