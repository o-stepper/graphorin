[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / memoryFlushHook

# Function: memoryFlushHook()

```ts
function memoryFlushHook(options): NamedPreCompactionHook;
```

Defined in: packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:66

**`Stable`**

Build the pre-compaction memory-flush hook. Register via
`contextEngine: { compaction: { preCompactionHooks: [memoryFlushHook({ provider })] } }`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryFlushHookOptions`](/api/@graphorin/memory/interfaces/MemoryFlushHookOptions.md) |

## Returns

[`NamedPreCompactionHook`](/api/@graphorin/memory/interfaces/NamedPreCompactionHook.md)
