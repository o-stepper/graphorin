[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / reviserConsolidatorPreset

# Function: reviserConsolidatorPreset()

```ts
function reviserConsolidatorPreset(options): ReviserConsolidatorConfig;
```

Defined in: [packages/memory/src/consolidator/presets.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L77)

Build the reviser consolidator configuration - pass the result as
`createMemory({ consolidator: reviserConsolidatorPreset({...}) })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ReviserPresetOptions`](/api/@graphorin/memory/interfaces/ReviserPresetOptions.md) |

## Returns

[`ReviserConsolidatorConfig`](/api/@graphorin/memory/interfaces/ReviserConsolidatorConfig.md)

## Stable
