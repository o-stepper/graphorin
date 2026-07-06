[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadDatasetFromTraces

# Function: loadDatasetFromTraces()

```ts
function loadDatasetFromTraces<I, O>(path, options): Promise<Dataset<I, O, Readonly<Record<string, unknown>>>>;
```

Defined in: evals/src/loaders/from-traces.ts:34

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | [`FromTracesOptions`](/api/@graphorin/evals/interfaces/FromTracesOptions.md)\<`I`, `O`\> |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<`I`, `O`, `Readonly`\<`Record`\<`string`, `unknown`\>\>\>\>

## Stable
