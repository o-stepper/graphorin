[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / facade

# facade

`createMemory()` - the facade that wires every tier sub-module (the
seven-tier system) + the eleven (+1 gated) memory tools + the search
reranker + the context engine
stubs + the consolidator placeholder.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CreateMemoryOptions](/api/@graphorin/memory/facade/interfaces/CreateMemoryOptions.md) | Options accepted by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetConsolidatorConfigWarningForTesting](/api/@graphorin/memory/facade/functions/resetConsolidatorConfigWarningForTesting.md) | - test seam for the one-time disabled-config warning. |
| [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md) | Wire every memory subsystem in one call. Returns the typed `Memory` facade ready to be passed into `createAgent({...})`. |

## References

### Memory

Re-exports [Memory](/api/@graphorin/memory/interfaces/Memory.md)
