[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / toResultEnvelope

# Function: toResultEnvelope()

```ts
function toResultEnvelope<TOutput>(opts): ResultEnvelope<TOutput>;
```

Defined in: packages/tools/src/result/envelope.ts:43

Convert a raw `execute(...)` return value into a canonical
[ResultEnvelope](/api/@graphorin/tools/interfaces/ResultEnvelope.md). Streaming-hint tools that returned `void`
use the `chunks` parameter to materialise the assembled body.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `chunks?`: readonly [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md)[]; `raw`: \| `TOutput` \| [`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt; \| `undefined`; \} |
| `opts.chunks?` | readonly [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md)[] |
| `opts.raw` | \| `TOutput` \| [`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt; \| `undefined` |

## Returns

[`ResultEnvelope`](/api/@graphorin/tools/interfaces/ResultEnvelope.md)\&lt;`TOutput`\&gt;

## Stable
