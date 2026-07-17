[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / renderJunitReport

# Function: renderJunitReport()

```ts
function renderJunitReport<I, O>(report, options?): string;
```

Defined in: [packages/evals/src/reporters/junit.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/reporters/junit.ts#L13)

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `report` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; |
| `options` | \{ `suiteName?`: `string`; \} |
| `options.suiteName?` | `string` |

## Returns

`string`

## Stable
