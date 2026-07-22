[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runConsolidatorSetTier

# Function: runConsolidatorSetTier()

```ts
function runConsolidatorSetTier(options): Promise<{
  applied: false;
  tier: ConsolidatorTier;
  unsupported: true;
}>;
```

Defined in: packages/cli/src/commands/consolidator.ts:134

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsolidatorSetTierOptions`](/api/@graphorin/cli/interfaces/ConsolidatorSetTierOptions.md) |

## Returns

`Promise`\<\{
  `applied`: `false`;
  `tier`: [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md);
  `unsupported`: `true`;
\}\>
