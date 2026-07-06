[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / pairedPassSignificance

# Function: pairedPassSignificance()

```ts
function pairedPassSignificance(current, baseline): PairedSignificance;
```

Defined in: evals/src/stats.ts:146

McNemar's paired test on per-case pass outcomes of two eval runs.
Only cases present in both maps are compared (by base case id).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | `ReadonlyMap`\<`string`, `boolean`\> |
| `baseline` | `ReadonlyMap`\<`string`, `boolean`\> |

## Returns

[`PairedSignificance`](/api/@graphorin/evals/interfaces/PairedSignificance.md)

## Stable
