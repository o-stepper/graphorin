[**Graphorin API reference v0.10.2**](../../../index.md)

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

Defined in: [packages/evals/src/stats.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/stats.ts#L99)

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
| `baseCases` | `number` | [packages/evals/src/stats.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/stats.ts#L101) |
| `k` | `number` | [packages/evals/src/stats.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/stats.ts#L101) |
| `value` | `number` | [packages/evals/src/stats.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/stats.ts#L101) |

## Stable
