[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EvalScorer

# Interface: EvalScorer\&lt;TInput, TOutput\&gt;

Defined in: packages/core/src/contracts/eval-scorer.ts:14

**`Stable`**

Pluggable evaluation scorer. Generic over the input / output types
carried by the eval dataset. Concrete implementations live in the
separate `@graphorin/evals` package (post-MVP); the interface lives
here so that:

- The minimal inline runner shipped with `@graphorin/observability` can
  type-check against it.
- Custom application-level scorers can be defined without taking an
  evals dependency.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/core/src/contracts/eval-scorer.ts:16 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/eval-scorer.ts:15 |

## Methods

### score()

```ts
score(sample): Promise<EvalScore>;
```

Defined in: packages/core/src/contracts/eval-scorer.ts:17

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sample` | [`EvalSample`](/api/@graphorin/core/interfaces/EvalSample.md)\&lt;`TInput`, `TOutput`\&gt; |

#### Returns

`Promise`\&lt;[`EvalScore`](/api/@graphorin/core/interfaces/EvalScore.md)\&gt;
