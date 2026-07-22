[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [facade](/api/@graphorin/memory/facade/index.md) / createMemory

# Function: createMemory()

```ts
function createMemory(options): Memory;
```

Defined in: packages/memory/src/facade.ts:421

**`Stable`**

Wire every memory subsystem in one call. Returns the typed
`Memory` facade ready to be passed into `createAgent({...})`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateMemoryOptions`](/api/@graphorin/memory/facade/interfaces/CreateMemoryOptions.md) |

## Returns

[`Memory`](/api/@graphorin/memory/interfaces/Memory.md)
