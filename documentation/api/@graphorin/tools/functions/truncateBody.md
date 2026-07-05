[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / truncateBody

# Function: truncateBody()

```ts
function truncateBody(opts): Promise<TruncationOutcome>;
```

Defined in: packages/tools/src/result/truncate.ts:171

Apply the per-strategy truncation pipeline.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `body`: `string`; `maxTokens`: `number`; `options?`: `TruncateOptions`; `strategy`: [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md); \} |
| `opts.body` | `string` |
| `opts.maxTokens` | `number` |
| `opts.options?` | `TruncateOptions` |
| `opts.strategy` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) |

## Returns

`Promise`\&lt;[`TruncationOutcome`](/api/@graphorin/tools/interfaces/TruncationOutcome.md)\&gt;

## Stable
