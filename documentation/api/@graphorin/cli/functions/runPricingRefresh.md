[**Graphorin API reference v0.13.4**](../../../index.md)

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

Defined in: packages/cli/src/commands/pricing.ts:92

**`Stable`**

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
