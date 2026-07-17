[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / fromIterable

# Function: fromIterable()

```ts
function fromIterable<I, O>(cases, options?): Dataset<I, O>;
```

Defined in: [packages/evals/src/loaders/iterable.ts:11](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/iterable.ts#L11)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cases` | \| `Iterable`\<[`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>, `any`, `any`\> \| readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[] |
| `options` | \{ `description?`: `string`; `name?`: `string`; \} |
| `options.description?` | `string` |
| `options.name?` | `string` |

## Returns

[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt;

## Stable
