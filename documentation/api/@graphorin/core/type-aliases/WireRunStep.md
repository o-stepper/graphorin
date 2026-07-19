[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireRunStep

# Type Alias: WireRunStep

```ts
type WireRunStep = Omit<RunStep, "toolCalls"> & {
  toolCalls: readonly WireCompletedToolCall[];
};
```

Defined in: packages/core/src/utils/binary-json.ts:132

**`Stable`**

Wire twin of [RunStep](/api/@graphorin/core/interfaces/RunStep.md).

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `toolCalls` | readonly [`WireCompletedToolCall`](/api/@graphorin/core/type-aliases/WireCompletedToolCall.md)[] | packages/core/src/utils/binary-json.ts:133 |
