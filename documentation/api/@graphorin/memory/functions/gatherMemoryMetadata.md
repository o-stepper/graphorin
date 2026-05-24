[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / gatherMemoryMetadata

# Function: gatherMemoryMetadata()

```ts
function gatherMemoryMetadata(scope, deps): Promise<MemoryMetadata>;
```

Defined in: packages/memory/src/context-engine/metadata.ts:37

Build the [MemoryMetadata](/api/@graphorin/core/interfaces/MemoryMetadata.md) block. Pure async — no side
effects beyond the storage reads.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `deps` | [`MemoryMetadataDeps`](/api/@graphorin/memory/interfaces/MemoryMetadataDeps.md) |

## Returns

`Promise`\&lt;[`MemoryMetadata`](/api/@graphorin/core/interfaces/MemoryMetadata.md)\&gt;

## Stable
