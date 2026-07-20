[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / defineContextLocalePack

# Function: defineContextLocalePack()

```ts
function defineContextLocalePack(input): PartialContextLocalePack;
```

Defined in: packages/memory/src/context-engine/locale-packs/types.ts:135

**`Stable`**

Build a [ContextLocalePack](/api/@graphorin/memory/interfaces/ContextLocalePack.md) from a partial input. Missing
fields fall back to the English default at compose time.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`PartialContextLocalePack`](/api/@graphorin/memory/interfaces/PartialContextLocalePack.md) |

## Returns

[`PartialContextLocalePack`](/api/@graphorin/memory/interfaces/PartialContextLocalePack.md)
