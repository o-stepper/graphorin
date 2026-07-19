[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolOutcome

# Type Alias: ToolOutcome\&lt;TOutput\&gt;

```ts
type ToolOutcome<TOutput> = 
  | ToolResult<TOutput>
  | ToolError;
```

Defined in: packages/core/src/types/tool.ts:288

**`Stable`**

Either a `ToolResult` or a `ToolError`. The runtime always returns one
of the two - there is no implicit "tool fell through" outcome.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |
