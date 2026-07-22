[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / truncateBody

# Function: truncateBody()

```ts
function truncateBody(opts): Promise<TruncationOutcome>;
```

Defined in: packages/tools/src/result/truncate.ts:207

**`Stable`**

Apply the per-strategy truncation pipeline.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `body`: `string`; `maxTokens`: `number`; `options?`: [`TruncateOptions`](/api/@graphorin/tools/interfaces/TruncateOptions.md); `strategy`: [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md); \} |
| `opts.body` | `string` |
| `opts.maxTokens` | `number` |
| `opts.options?` | [`TruncateOptions`](/api/@graphorin/tools/interfaces/TruncateOptions.md) |
| `opts.strategy` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) |

## Returns

`Promise`\&lt;[`TruncationOutcome`](/api/@graphorin/tools/interfaces/TruncationOutcome.md)\&gt;
