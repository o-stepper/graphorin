[**Graphorin API reference v0.13.3**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / GeneratorCallable

# Type Alias: GeneratorCallable\&lt;TOutput\&gt;

```ts
type GeneratorCallable<TOutput> = (input, priorCritique, iteration) => Promise<TOutput>;
```

Defined in: packages/agent/src/evaluator-optimizer/index.ts:47

**`Stable`**

Generator callable shape. Receives the original user input plus
the previous iteration's critique (or `undefined` on the first
iteration) and returns the new candidate output.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `priorCritique` | `string` \| `undefined` |
| `iteration` | `number` |

## Returns

`Promise`\&lt;`TOutput`\&gt;
