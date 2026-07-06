[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [loaders](/api/@graphorin/evals/loaders/index.md) / groupAndExtract

# Function: groupAndExtract()

```ts
function groupAndExtract<I, O>(text, options): Dataset<I, O>;
```

Defined in: evals/src/loaders/from-traces.ts:48

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
| `options` | [`FromTracesOptions`](/api/@graphorin/evals/interfaces/FromTracesOptions.md)\<`I`, `O`\> |

## Returns

[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<`I`, `O`\>

## Stable
