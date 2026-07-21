[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / Scorer

# Interface: Scorer\&lt;I, O\&gt;

Defined in: packages/observability/src/eval/types.ts:49

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/observability/src/eval/types.ts:50 |

## Methods

### score()

```ts
score(args): Promise<ScoreResult>;
```

Defined in: packages/observability/src/eval/types.ts:51

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `case`: [`Case`](/api/@graphorin/observability/interfaces/Case.md)\&lt;`I`, `O`\&gt;; `durationMs`: `number`; `output`: `O`; \} |
| `args.case` | [`Case`](/api/@graphorin/observability/interfaces/Case.md)\&lt;`I`, `O`\&gt; |
| `args.durationMs` | `number` |
| `args.output` | `O` |

#### Returns

`Promise`\&lt;[`ScoreResult`](/api/@graphorin/observability/interfaces/ScoreResult.md)\&gt;
