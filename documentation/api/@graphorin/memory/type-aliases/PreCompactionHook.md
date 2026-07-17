[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PreCompactionHook

# Type Alias: PreCompactionHook

```ts
type PreCompactionHook = (ctx) => Promise<void>;
```

Defined in: [packages/memory/src/context-engine/compaction/types.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L250)

Pre-compaction hook signature (wave-D D4). Side-effect only - a
pre-hook cannot alter what gets compacted; a throwing hook is
recorded in `hookFailures` and never blocks the compaction.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`PreCompactionHookContext`](/api/@graphorin/memory/interfaces/PreCompactionHookContext.md) |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
