[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / getTraceLog

# Function: getTraceLog()

```ts
function getTraceLog(filePath): AsyncIterable<SpanRecord<SpanType>>;
```

Defined in: packages/observability/src/replay/log.ts:21

Read every span record from a JSONL trace log. Lines that fail to
parse are emitted as `null` events; callers can `filter(Boolean)` to
skip them.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |

## Returns

`AsyncIterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;\>

## Stable
