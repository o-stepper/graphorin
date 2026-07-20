[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / proactiveOutcomeWithinGrant

# Function: proactiveOutcomeWithinGrant()

```ts
function proactiveOutcomeWithinGrant(kind, grant): boolean;
```

Defined in: packages/core/src/types/proactive.ts:59

**`Stable`**

`true` when `kind` sits at or below `grant` on the ladder.
Deterministic, pure - the ladder routing policy helper.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`ProactiveOutcomeKind`](/api/@graphorin/core/type-aliases/ProactiveOutcomeKind.md) |
| `grant` | [`ProactiveOutcomeKind`](/api/@graphorin/core/type-aliases/ProactiveOutcomeKind.md) |

## Returns

`boolean`
