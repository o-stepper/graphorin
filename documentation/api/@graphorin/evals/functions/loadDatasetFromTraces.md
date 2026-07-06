[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadDatasetFromTraces

# Function: loadDatasetFromTraces()

```ts
function loadDatasetFromTraces<I, O>(path, options): Promise<Dataset<I, O, Readonly<Record<string, unknown>>>>;
```

Defined in: [packages/evals/src/loaders/from-traces.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/from-traces.ts#L34)

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | [`FromTracesOptions`](/api/@graphorin/evals/interfaces/FromTracesOptions.md)\&lt;`I`, `O`\&gt; |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<`I`, `O`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>

## Stable
