[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / pairedPassSignificance

# Function: pairedPassSignificance()

```ts
function pairedPassSignificance(current, baseline): PairedSignificance;
```

Defined in: [packages/evals/src/stats.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/stats.ts#L146)

McNemar's paired test on per-case pass outcomes of two eval runs.
Only cases present in both maps are compared (by base case id).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | `ReadonlyMap`\&lt;`string`, `boolean`\&gt; |
| `baseline` | `ReadonlyMap`\&lt;`string`, `boolean`\&gt; |

## Returns

[`PairedSignificance`](/api/@graphorin/evals/interfaces/PairedSignificance.md)

## Stable
