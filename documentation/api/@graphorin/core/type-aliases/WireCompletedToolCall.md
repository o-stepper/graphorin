[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireCompletedToolCall

# Type Alias: WireCompletedToolCall\&lt;TOutput\&gt;

```ts
type WireCompletedToolCall<TOutput> = Omit<CompletedToolCall<TOutput>, "outcome"> & {
  outcome: WireToolOutcome<TOutput>;
};
```

Defined in: [packages/core/src/utils/binary-json.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L124)

Wire twin of [CompletedToolCall](/api/@graphorin/core/interfaces/CompletedToolCall.md).

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `outcome` | [`WireToolOutcome`](/api/@graphorin/core/type-aliases/WireToolOutcome.md)\&lt;`TOutput`\&gt; | [packages/core/src/utils/binary-json.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L128) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Stable
