[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSpec

# Type Alias: ToolSpec\&lt;TInput, TOutput, TDeps\&gt;

```ts
type ToolSpec<TInput, TOutput, TDeps> = Omit<Tool<TInput, TOutput, TDeps>, "execute"> & {
  execute: (input, ctx) => Promise<
     | TOutput
     | ToolReturn<TOutput>
    | undefined>;
};
```

Defined in: packages/tools/src/builder/tool.ts:26

**`Stable`**

Spec accepted by the [tool](/api/@graphorin/tools/functions/tool.md) factory. Mirrors the [Tool](/api/@graphorin/core/interfaces/Tool.md)
interface but accepts the `execute` field as the second positional
parameter or as a property - both work equivalently.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `execute()` | (`input`, `ctx`) => `Promise`\< \| `TOutput` \| [`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt; \| `undefined`\> | packages/tools/src/builder/tool.ts:30 |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |
