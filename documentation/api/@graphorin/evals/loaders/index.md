[**Graphorin API reference v0.4.0**](../../../index.md)

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

### loadDmrDataset

Re-exports [loadDmrDataset](/api/@graphorin/evals/functions/loadDmrDataset.md)

***

### LoadDmrOptions

Re-exports [LoadDmrOptions](/api/@graphorin/evals/interfaces/LoadDmrOptions.md)

***

### loadJsonlDataset

Re-exports [loadJsonlDataset](/api/@graphorin/evals/functions/loadJsonlDataset.md)

***

### LoadJsonlOptions

Re-exports [LoadJsonlOptions](/api/@graphorin/evals/interfaces/LoadJsonlOptions.md)

***

### loadLocomoDataset

Re-exports [loadLocomoDataset](/api/@graphorin/evals/functions/loadLocomoDataset.md)

***

### LoadLocomoOptions

Re-exports [LoadLocomoOptions](/api/@graphorin/evals/interfaces/LoadLocomoOptions.md)

***

### loadLongMemEvalDataset

Re-exports [loadLongMemEvalDataset](/api/@graphorin/evals/functions/loadLongMemEvalDataset.md)

***

### LoadLongMemEvalOptions

Re-exports [LoadLongMemEvalOptions](/api/@graphorin/evals/interfaces/LoadLongMemEvalOptions.md)

***

### MemoryEvalAbility

Re-exports [MemoryEvalAbility](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)

***

### MemoryEvalInput

Re-exports [MemoryEvalInput](/api/@graphorin/evals/interfaces/MemoryEvalInput.md)

***

### MemoryEvalSession

Re-exports [MemoryEvalSession](/api/@graphorin/evals/interfaces/MemoryEvalSession.md)

***

### MemoryEvalTurn

Re-exports [MemoryEvalTurn](/api/@graphorin/evals/interfaces/MemoryEvalTurn.md)

***

### parseCsv

Re-exports [parseCsv](/api/@graphorin/evals/functions/parseCsv.md)

***

### parseDmr

Re-exports [parseDmr](/api/@graphorin/evals/functions/parseDmr.md)

***

### parseJsonl

Re-exports [parseJsonl](/api/@graphorin/evals/functions/parseJsonl.md)

***

### parseLocomo

Re-exports [parseLocomo](/api/@graphorin/evals/functions/parseLocomo.md)

***

### parseLongMemEval

Re-exports [parseLongMemEval](/api/@graphorin/evals/functions/parseLongMemEval.md)

***

### TraceEvent

Re-exports [TraceEvent](/api/@graphorin/evals/interfaces/TraceEvent.md)
