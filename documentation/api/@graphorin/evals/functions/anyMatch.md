[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / anyMatch

# Function: anyMatch()

```ts
function anyMatch(
   gold, 
   observed, 
   matcher): boolean;
```

Defined in: [packages/evals/src/scorers/memory/util.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/util.ts#L62)

True when some observed point matches the gold text.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `gold` | `string` |
| `observed` | readonly `string`[] |
| `matcher` | [`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md) |

## Returns

`boolean`
