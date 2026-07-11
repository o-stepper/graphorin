[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [loaders](/api/@graphorin/evals/loaders/index.md) / groupAndExtract

# Function: groupAndExtract()

```ts
function groupAndExtract<I, O>(text, options): Dataset<I, O>;
```

Defined in: [packages/evals/src/loaders/from-traces.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L48)

Pure parser for the trace JSONL format. Exported so tests can
exercise the extraction without touching the filesystem.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `options` | [`FromTracesOptions`](/api/@graphorin/evals/interfaces/FromTracesOptions.md)\&lt;`I`, `O`\&gt; |

## Returns

[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt;

## Stable
