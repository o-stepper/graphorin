# document-pipeline

## 0.1.0

Initial release of the Graphorin workflow concurrency acceptance demo. Wires `@graphorin/workflow`'s step-graph engine to an eight-node document ingestion pipeline (`parse` → fan-out `chunk` × N → `embed-chunks` + `summarize-page` → `barrier` → `index`) that exercises every channel kind shipped by `@graphorin/core` (`LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`) plus dynamic task scheduling via `Dispatch`. Runs hermetically against `InMemoryCheckpointStore` with a deterministic 8-dim FNV-1a stub embedder, so CI never depends on a live LLM, embedding service, or vector store.
