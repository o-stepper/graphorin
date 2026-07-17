[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / defaultTruncationStrategy

# Function: defaultTruncationStrategy()

```ts
function defaultTruncationStrategy(trustClass, toolName): TruncationStrategy;
```

Defined in: [packages/tools/src/builder/trust-class.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/builder/trust-class.ts#L90)

Default truncation strategy per trust class + tool name.

- Built-in `web_search`     → `'summarize'`.
- Built-in `code_execution` → `'tail'`.
- Everything else           → `'middle'`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) |
| `toolName` | `string` |

## Returns

[`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md)

## Stable
