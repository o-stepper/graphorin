[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / exactMatch

# Function: exactMatch()

```ts
function exactMatch<I, O>(options?): Scorer<I, O>;
```

Defined in: packages/evals/src/scorers/code/exact-match.ts:26

**`Stable`**

Build an exact-match scorer.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | `unknown` |
| `O` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ExactMatchOptions`](/api/@graphorin/evals/interfaces/ExactMatchOptions.md) |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;
