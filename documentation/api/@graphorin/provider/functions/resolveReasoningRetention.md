[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / resolveReasoningRetention

# Function: resolveReasoningRetention()

```ts
function resolveReasoningRetention(input): ReasoningRetention;
```

Defined in: packages/provider/src/reasoning/retention.ts:55

Resolve the effective [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) value for a single
request. The resolution is precedence-driven:

1. `requested` wins if defined.
2. `overridden` wins next.
3. The default for `contract` is used if the contract is known.
4. `'strip'` is the conservative fallback when no input is supplied.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ResolveReasoningRetentionInput`](/api/@graphorin/provider/interfaces/ResolveReasoningRetentionInput.md) |

## Returns

[`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md)

## Stable
