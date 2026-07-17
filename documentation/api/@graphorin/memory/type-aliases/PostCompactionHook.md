[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PostCompactionHook

# Type Alias: PostCompactionHook

```ts
type PostCompactionHook = (ctx) => Promise<ReadonlyArray<MessageContent>>;
```

Defined in: [packages/memory/src/context-engine/compaction/types.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L216)

Post-compaction hook signature. Each hook returns the
`MessageContent[]` parts the harness should append to the
trimmed message buffer (re-injected Context Essentials).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`PostCompactionHookContext`](/api/@graphorin/memory/interfaces/PostCompactionHookContext.md) |

## Returns

`Promise`\<`ReadonlyArray`\&lt;[`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)\&gt;\>

## Stable
