[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / createDefaultSpillWriter

# Function: createDefaultSpillWriter()

```ts
function createDefaultSpillWriter(options?): SpillWriter;
```

Defined in: packages/tools/src/result/spill.ts:61

Build the default spill writer — writes the un-truncated body to
`<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>` with `0600`
permissions and tier-aware sensitivity inheritance.

Lifecycle (TL-10): `clear(runId)` removes one run's artifacts (the
agent calls it on terminal completed/failed runs); `sweep(ttlMs)`
removes run directories older than the TTL, and one best-effort
7-day sweep fires at construction to collect orphans from crashed
processes.

Operators that need a sandbox-aware path inject their own writer via
`createToolExecutor({ spill })` (and a matching reader for `read_result`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `DefaultSpillWriterOptions` |

## Returns

`SpillWriter`

## Stable
