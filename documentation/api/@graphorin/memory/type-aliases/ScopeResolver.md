[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ScopeResolver

# Type Alias: ScopeResolver

```ts
type ScopeResolver = (ctx) => 
  | SessionScope
| Promise<SessionScope>;
```

Defined in: packages/memory/src/tools/types.ts:17

**`Stable`**

Resolver that produces the live [SessionScope](/api/@graphorin/core/interfaces/SessionScope.md) for the tool
call from the surrounding agent run context. The agent runtime
(Phase 12) supplies a closure that reads `RunContext` directly;
standalone callers can pass a fixed scope.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`ToolExecutionContext`](/api/@graphorin/core/interfaces/ToolExecutionContext.md) |

## Returns

  \| [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md)
  \| `Promise`\&lt;[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md)\&gt;
