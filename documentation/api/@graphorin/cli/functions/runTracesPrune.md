[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runTracesPrune

# Function: runTracesPrune()

```ts
function runTracesPrune(options): Promise<TracesPruneResult>;
```

Defined in: [packages/cli/src/commands/traces.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L115)

Delete spans that FINISHED before the cutoff (see `pruneSpans` in
`@graphorin/store-sqlite` - the ms-to-ns conversion and the strict
`<` boundary live there, backed by the `idx_spans_end` index).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TracesPruneOptions`](/api/@graphorin/cli/interfaces/TracesPruneOptions.md) |

## Returns

`Promise`\&lt;[`TracesPruneResult`](/api/@graphorin/cli/interfaces/TracesPruneResult.md)\&gt;

## Stable
