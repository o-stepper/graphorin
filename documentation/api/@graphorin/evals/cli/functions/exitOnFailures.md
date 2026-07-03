[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [cli](/api/@graphorin/evals/cli/index.md) / exitOnFailures

# Function: exitOnFailures()

```ts
function exitOnFailures<I, O>(report, regression?): void;
```

Defined in: evals/src/cli/index.ts:51

Set `process.exitCode` to `1` when at least one case failed, or
when a regression report contains findings. Uses `exitCode` rather
than `process.exit` so other async tasks finish cleanly.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `report` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; |
| `regression?` | [`RegressionReport`](/api/@graphorin/evals/interfaces/RegressionReport.md)\&lt;`I`, `O`\&gt; |

## Returns

`void`

## Stable
