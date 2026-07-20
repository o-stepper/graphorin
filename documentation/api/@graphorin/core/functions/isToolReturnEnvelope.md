[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / isToolReturnEnvelope

# Function: isToolReturnEnvelope()

```ts
function isToolReturnEnvelope<TOutput>(value): value is ToolReturn<TOutput>;
```

Defined in: packages/core/src/contracts/tool.ts:310

**`Stable`**

The ONE guard for the ToolReturn envelope (the executor and
the registry example-normalizer both consume it). Brand first; the
structural fallback accepts only objects whose OWN enumerable keys
all belong to the canonical envelope shape - `{output, exitCode}`
style process results pass through intact.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`value is ToolReturn<TOutput>`
