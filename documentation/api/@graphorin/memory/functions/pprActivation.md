[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / pprActivation

# Function: pprActivation()

```ts
function pprActivation(neighbours, damping?): number[];
```

Defined in: [packages/memory/src/search/graph-ppr.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/graph-ppr.ts#L32)

Compute PPR-lite activation for graded neighbours. `damping` in
`(0, 1]`; a neighbour at `depth` d contributes `damping^d` per seed
that reaches it. Since `expandActivation` already returns the MINIMUM
depth per neighbour (dedup across seeds), the score here is a pure
function of that min-depth - `damping^depth`, clamped to `[0, 1]`.
A neighbour list produced with `maxHops: 1` reproduces a flat-ish
score of `damping` at every node; `maxHops: 2` separates the tiers.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `neighbours` | readonly \{ `depth`: `number`; \}[] | `undefined` |
| `damping` | `number` | `DEFAULT_PPR_DAMPING` |

## Returns

`number`[]

## Stable
