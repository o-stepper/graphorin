[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / checkpoint-store-memory

# checkpoint-store-memory

In-memory `CheckpointStore` adapter. Useful in tests, REPL
sessions, and small examples where SQLite would be overkill. The
production-grade adapter lives in `@graphorin/store-sqlite`.

## Classes

| Class | Description |
| ------ | ------ |
| [InMemoryCheckpointStore](/api/@graphorin/workflow/checkpoint-store-memory/classes/InMemoryCheckpointStore.md) | Pure in-memory `CheckpointStore` implementation. Thread-safe within a single Node.js event loop because every mutation is synchronous; concurrent runs that share the same instance will see a consistent view. |
