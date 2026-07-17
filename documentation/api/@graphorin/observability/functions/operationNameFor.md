[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / operationNameFor

# Function: operationNameFor()

```ts
function operationNameFor(type): 
  | GenAIOperationName
  | undefined;
```

Defined in: [packages/observability/src/gen-ai/operation-mapping.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/operation-mapping.ts#L78)

Resolve the canonical `gen_ai.operation.name` value for a Graphorin
span type. Returns `undefined` if no mapping exists (e.g. for
`replay.*` markers, which are emitted via a separate code path).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Returns

  \| [`GenAIOperationName`](/api/@graphorin/observability/type-aliases/GenAIOperationName.md)
  \| `undefined`

## Stable
