[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryReview

# Function: runMemoryReview()

```ts
function runMemoryReview(options?): Promise<MemoryReviewResult>;
```

Defined in: packages/cli/src/commands/memory.ts:728

`graphorin memory review` - list the facts / episodes / insights / induced
procedures the consolidator left in quarantine (read-only), or promote a
reviewed item out of quarantine with `--promote <id>`. The promote path runs
through the tier `validate(...)`, so an injection-flagged memory is refused
unless `--force` is supplied after review (MCON-2).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryReviewOptions`](/api/@graphorin/cli/interfaces/MemoryReviewOptions.md) |

## Returns

`Promise`\<[`MemoryReviewResult`](/api/@graphorin/cli/interfaces/MemoryReviewResult.md)\>

## Stable
