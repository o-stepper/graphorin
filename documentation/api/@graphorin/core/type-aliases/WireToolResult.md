[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireToolResult

# Type Alias: WireToolResult\&lt;TOutput\&gt;

```ts
type WireToolResult<TOutput> = Omit<ToolResult<TOutput>, "contentParts"> & {
  contentParts?: readonly WireMessageContent[];
};
```

Defined in: [packages/core/src/utils/binary-json.ts:116](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L116)

Wire twin of [ToolResult](/api/@graphorin/core/interfaces/ToolResult.md): `contentParts` are encoded.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `contentParts?` | readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | [packages/core/src/utils/binary-json.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L117) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Stable
