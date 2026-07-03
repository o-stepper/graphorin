[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Scorer

# Interface: Scorer\&lt;I, O\&gt;

Defined in: observability/dist/eval/types.d.ts:46

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | observability/dist/eval/types.d.ts:47 |

## Methods

### score()

```ts
score(args): Promise<ScoreResult>;
```

Defined in: observability/dist/eval/types.d.ts:48

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `case`: [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`I`, `O`\&gt;; `durationMs`: `number`; `output`: `O`; \} |
| `args.case` | [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`I`, `O`\&gt; |
| `args.durationMs` | `number` |
| `args.output` | `O` |

#### Returns

`Promise`\&lt;[`ScoreResult`](/api/@graphorin/evals/interfaces/ScoreResult.md)\&gt;
