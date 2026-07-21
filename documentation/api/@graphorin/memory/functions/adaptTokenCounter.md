[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / adaptTokenCounter

# Function: adaptTokenCounter()

```ts
function adaptTokenCounter(counter): ContextTokenCounter & Pick<TokenCounter, "count">;
```

Defined in: packages/memory/src/context-engine/token-counter.ts:76

**`Stable`**

Wrap a real [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md) into the narrower
[ContextTokenCounter](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) surface - PRESERVING the native
message-level `count(messages)`. The adapter
used to keep only `countText`, which forced
[countMessageTokens](/api/@graphorin/memory/functions/countMessageTokens.md) onto the per-message render path for
every real counter; combined with `renderMessageText` ignoring
tool calls, tool-call arguments contributed zero to every trigger /
before / after count while the provider billed for them.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `counter` | [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md) |

## Returns

[`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) & `Pick`\&lt;[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md), `"count"`\&gt;
