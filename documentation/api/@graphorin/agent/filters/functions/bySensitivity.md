[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / bySensitivity

# Function: bySensitivity()

```ts
function bySensitivity(args?): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L186)

Drop messages whose effective sensitivity ceiling exceeds
`maxTier`. Messages without sensitivity metadata default to
`'public'` and are always kept.

The framework currently records sensitivity at the
`MessageContent` part level via the `inboundTrust` / `secret`
annotations. v0.1 ships a coarse-grained heuristic: a message is
kept iff every text part's content does not contain the literal
`[REDACTED:secret]` token AND every part's annotated sensitivity
is acceptable to `maxTier`. Operators that need a stricter
filter compose the function with `stripSensitiveOutputs()` or a
custom predicate.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `maxTier?`: [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md); \} |
| `args.maxTier?` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
