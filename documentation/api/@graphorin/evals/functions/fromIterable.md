[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / fromIterable

# Function: fromIterable()

```ts
function fromIterable<I, O>(cases, options?): Dataset<I, O>;
```

Defined in: evals/src/loaders/iterable.ts:11

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cases` | \| `Iterable`\<[`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\&lt;`Record`\&lt;`string`, `unknown`\&gt;\&gt;\>, `any`, `any`\> \| readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\&lt;`Record`\&lt;`string`, `unknown`\&gt;\&gt;\>[] |
| `options` | \{ `description?`: `string`; `name?`: `string`; \} |
| `options.description?` | `string` |
| `options.name?` | `string` |

## Returns

[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt;

## Stable
