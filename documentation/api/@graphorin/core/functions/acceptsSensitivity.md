[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / acceptsSensitivity

# Function: acceptsSensitivity()

```ts
function acceptsSensitivity(accepts, record): boolean;
```

Defined in: packages/core/src/types/sensitivity.ts:33

**`Stable`**

Return `true` iff `record` is allowed to flow to a sink declaring `accepts`.

Comparison is **subset** semantics: the record's tier must be one of the
tiers in `accepts` (it's not enough for the record's tier to be lower).
That mirrors the way provider `acceptsSensitivity` is declared in the
Graphorin trust matrix.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `accepts` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] |
| `record` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) |

## Returns

`boolean`
