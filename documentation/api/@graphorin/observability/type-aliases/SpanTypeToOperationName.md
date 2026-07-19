[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SpanTypeToOperationName

# Type Alias: SpanTypeToOperationName

```ts
type SpanTypeToOperationName = (type) => 
  | GenAIOperationName
  | undefined;
```

Defined in: packages/observability/src/gen-ai/types.ts:143

**`Stable`**

Mapping from a Graphorin `SpanType` to the canonical
`gen_ai.operation.name` value. Returns `undefined` for span types
that do not have a canonical operation enum (`replay.*` is recorded
as `'replay.run'` / `'replay.skipped'` per the doc table).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Returns

  \| [`GenAIOperationName`](/api/@graphorin/observability/type-aliases/GenAIOperationName.md)
  \| `undefined`
