[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / wilsonInterval

# Function: wilsonInterval()

```ts
function wilsonInterval(
   passed, 
   total, 
   z?): {
  hi: number;
  lo: number;
};
```

Defined in: packages/evals/src/stats.ts:60

**`Stable`**

Wilson score interval for a binomial proportion.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `passed` | `number` | `undefined` | number of successes |
| `total` | `number` | `undefined` | number of trials |
| `z` | `number` | `1.96` | normal quantile (default 1.96 = 95% two-sided) |

## Returns

```ts
{
  hi: number;
  lo: number;
}
```

`{ lo, hi }` clamped to [0, 1]; `{ lo: 0, hi: 1 }` when `total` is 0

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `hi` | `number` | packages/evals/src/stats.ts:64 |
| `lo` | `number` | packages/evals/src/stats.ts:64 |
