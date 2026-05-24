[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / facade

# facade

`createMemory()` — the facade that wires every six-tier sub-module +
the nine memory tools + the search reranker + the context engine
stubs + the consolidator placeholder.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CreateMemoryOptions](/api/@graphorin/memory/facade/interfaces/CreateMemoryOptions.md) | Options accepted by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md). |
| [Memory](/api/@graphorin/memory/facade/interfaces/Memory.md) | The facade returned by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md) | Wire every memory subsystem in one call. Returns the typed `Memory` facade ready to be passed into `createAgent({...})`. |
