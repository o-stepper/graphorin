[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / detectRegressions

# Function: detectRegressions()

```ts
function detectRegressions<I, O>(
   current, 
   baseline, 
options?): RegressionReport<I, O>;
```

Defined in: packages/evals/src/regression.ts:45

**`Stable`**

Detect regressions between `current` and `baseline` reports.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; |
| `baseline` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; |
| `options` | [`RegressionOptions`](/api/@graphorin/evals/interfaces/RegressionOptions.md) |

## Returns

[`RegressionReport`](/api/@graphorin/evals/interfaces/RegressionReport.md)\&lt;`I`, `O`\&gt;
