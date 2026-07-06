[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Scorer

# Interface: Scorer\<I, O\>

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
| `args` | \{ `case`: [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`\>; `durationMs`: `number`; `output`: `O`; \} |
| `args.case` | [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`\> |
| `args.durationMs` | `number` |
| `args.output` | `O` |

#### Returns

`Promise`\<[`ScoreResult`](/api/@graphorin/evals/interfaces/ScoreResult.md)\>
