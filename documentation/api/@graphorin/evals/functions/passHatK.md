[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / passHatK

# Function: passHatK()

```ts
function passHatK(outcomes): {
  baseCases: number;
  k: number;
  value: number;
};
```

Defined in: packages/evals/src/stats.ts:99

**`Stable`**

pass^k over per-iteration case outcomes: group by base case id and
report the fraction of base cases whose EVERY iteration passed.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `outcomes` | readonly \{ `caseId`: `string`; `pass`: `boolean`; \}[] | one entry per executed case iteration |

## Returns

```ts
{
  baseCases: number;
  k: number;
  value: number;
}
```

`k` = the largest group size observed, `baseCases` = number of
  distinct base cases, `value` = the pass^k fraction (0 when no cases)

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `baseCases` | `number` | packages/evals/src/stats.ts:101 |
| `k` | `number` | packages/evals/src/stats.ts:101 |
| `value` | `number` | packages/evals/src/stats.ts:101 |
