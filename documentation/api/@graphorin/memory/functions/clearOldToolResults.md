[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / clearOldToolResults

# Function: clearOldToolResults()

```ts
function clearOldToolResults(
   messages, 
   options, 
counter): Promise<ClearToolResultsOutcome>;
```

Defined in: [packages/memory/src/context-engine/compaction/clear-tool-results.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L114)

Replace the oldest clearable tool results with placeholders. Returns the new
buffer (same length - content is replaced in place, never removed) plus the
cleared indices and reclaimed token count. Idempotent: already-cleared
placeholders are skipped on a second pass.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `options` | [`ClearToolResultsOptions`](/api/@graphorin/memory/interfaces/ClearToolResultsOptions.md) |
| `counter` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) |

## Returns

`Promise`\&lt;[`ClearToolResultsOutcome`](/api/@graphorin/memory/interfaces/ClearToolResultsOutcome.md)\&gt;
