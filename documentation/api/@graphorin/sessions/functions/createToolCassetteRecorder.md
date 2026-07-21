[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / createToolCassetteRecorder

# Function: createToolCassetteRecorder()

```ts
function createToolCassetteRecorder(options): ToolCassetteRecorder;
```

Defined in: packages/sessions/src/cassette/recorder.ts:92

**`Stable`**

Build a recorder that buffers every record into memory and flushes
to disk on `flushToFile()`. The recorder is intentionally
memory-buffered for v0.1; a streaming variant (writes lines to disk
as they come in) is a follow-up once the agent runtime lands and
we have hard p95-overhead numbers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md) |

## Returns

[`ToolCassetteRecorder`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorder.md)
