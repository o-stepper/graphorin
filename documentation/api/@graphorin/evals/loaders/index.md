[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / loaders

# loaders

Dataset loaders. Every loader returns a fully-materialised
Dataset that the runner can iterate over without further
I/O. Streaming loaders are a post-MVP follow-up.

## Functions

| Function | Description |
| ------ | ------ |
| [groupAndExtract](/api/@graphorin/evals/loaders/functions/groupAndExtract.md) | Pure parser for the trace JSONL format. Exported so tests can exercise the extraction without touching the filesystem. |

## References

### fromIterable

Re-exports [fromIterable](/api/@graphorin/evals/functions/fromIterable.md)

***

### FromTracesOptions

Re-exports [FromTracesOptions](/api/@graphorin/evals/interfaces/FromTracesOptions.md)

***

### loadCsvDataset

Re-exports [loadCsvDataset](/api/@graphorin/evals/functions/loadCsvDataset.md)

***

### LoadCsvOptions

Re-exports [LoadCsvOptions](/api/@graphorin/evals/interfaces/LoadCsvOptions.md)

***

### loadDatasetFromTraces

Re-exports [loadDatasetFromTraces](/api/@graphorin/evals/functions/loadDatasetFromTraces.md)

***

### loadJsonlDataset

Re-exports [loadJsonlDataset](/api/@graphorin/evals/functions/loadJsonlDataset.md)

***

### LoadJsonlOptions

Re-exports [LoadJsonlOptions](/api/@graphorin/evals/interfaces/LoadJsonlOptions.md)

***

### parseCsv

Re-exports [parseCsv](/api/@graphorin/evals/functions/parseCsv.md)

***

### parseJsonl

Re-exports [parseJsonl](/api/@graphorin/evals/functions/parseJsonl.md)

***

### TraceEvent

Re-exports [TraceEvent](/api/@graphorin/evals/interfaces/TraceEvent.md)
