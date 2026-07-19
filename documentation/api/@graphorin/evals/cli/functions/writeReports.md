[**Graphorin API reference v0.13.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [cli](/api/@graphorin/evals/cli/index.md) / writeReports

# Function: writeReports()

```ts
function writeReports<I, O>(options): Promise<readonly WrittenReport[]>;
```

Defined in: packages/evals/src/cli/index.ts:87

**`Stable`**

Render the report in every requested format and write each one to a
file. Returns the manifest of written files.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`WriteReportsOptions`](/api/@graphorin/evals/cli/interfaces/WriteReportsOptions.md)\&lt;`I`, `O`\&gt; |

## Returns

`Promise`\&lt;readonly [`WrittenReport`](/api/@graphorin/evals/cli/interfaces/WrittenReport.md)[]\&gt;
