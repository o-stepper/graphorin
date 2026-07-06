[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / normaliseTool

# Function: normaliseTool()

```ts
function normaliseTool<TInput, TOutput, TDeps>(tool, source): NormaliseOutcome<TInput, TOutput, TDeps>;
```

Defined in: [packages/tools/src/registry/normalize.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L104)

Normalise a tool registration. Throws on programming errors
(invalid examples, invalid `preferredModel`, invalid
`sideEffectClass`); collects WARN markers for the
conservative-default branches.

## Type Parameters

| Type Parameter |
| ------ |
| `TInput` |
| `TOutput` |
| `TDeps` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; |
| `source` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) |

## Returns

[`NormaliseOutcome`](/api/@graphorin/tools/interfaces/NormaliseOutcome.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt;

## Stable
