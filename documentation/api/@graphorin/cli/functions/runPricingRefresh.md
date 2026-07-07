[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runPricingRefresh

# Function: runPricingRefresh()

```ts
function runPricingRefresh(options): Promise<{
  entries: number;
  out?: string;
  skipped?: number;
  version: string;
}>;
```

Defined in: [packages/cli/src/commands/pricing.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/pricing.ts#L91)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PricingRefreshOptions`](/api/@graphorin/cli/interfaces/PricingRefreshOptions.md) |

## Returns

`Promise`\<\{
  `entries`: `number`;
  `out?`: `string`;
  `skipped?`: `number`;
  `version`: `string`;
\}\>

## Stable
