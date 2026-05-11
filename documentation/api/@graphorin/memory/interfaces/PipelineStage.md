[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PipelineStage

# Interface: PipelineStage

Defined in: packages/memory/src/conflict/types.ts:167

Stage interface every step implements. The orchestrator visits
stages in declaration order and stops at the first non-`'continue'`
outcome.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | [`ConflictStage`](/api/@graphorin/memory/type-aliases/ConflictStage.md) | packages/memory/src/conflict/types.ts:168 |

## Methods

### evaluate()

```ts
evaluate(ctx): Promise<StageOutcome>;
```

Defined in: packages/memory/src/conflict/types.ts:169

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`StageContext`](/api/@graphorin/memory/interfaces/StageContext.md) |

#### Returns

`Promise`\&lt;[`StageOutcome`](/api/@graphorin/memory/type-aliases/StageOutcome.md)\&gt;
