[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [preferred-model](/api/@graphorin/agent/preferred-model/index.md) / resolvePreferredModel

# Function: resolvePreferredModel()

```ts
function resolvePreferredModel(input): PreferredModelResolution;
```

Defined in: [packages/agent/src/preferred-model/index.ts:132](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L132)

Walk the precedence ladder and return the resolved provider for a
single agent step. Pure function - no side effects.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ResolvePreferredModelInput`](/api/@graphorin/agent/preferred-model/interfaces/ResolvePreferredModelInput.md) |

## Returns

[`PreferredModelResolution`](/api/@graphorin/agent/preferred-model/interfaces/PreferredModelResolution.md)

## Stable
