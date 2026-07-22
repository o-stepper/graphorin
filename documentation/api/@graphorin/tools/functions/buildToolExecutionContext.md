[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / buildToolExecutionContext

# Function: buildToolExecutionContext()

```ts
function buildToolExecutionContext<TDeps>(opts): ToolExecutionContext<TDeps>;
```

Defined in: packages/tools/src/executor/tool-context.ts:76

**`Stable`**

Build a [ToolExecutionContext](/api/@graphorin/core/interfaces/ToolExecutionContext.md) for one invocation. The
returned context honours the tool's `secretsAllowed` ACL - calls to
`ctx.secrets.require(...)` for keys outside the allowlist throw
`SecretAccessDeniedError`.

The context also wires the streaming surface: `ctx.reportProgress`
+ `ctx.streamContent` are no-ops when the tool's `__streamingHint`
is `false`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ToolContextOptions`](/api/@graphorin/tools/interfaces/ToolContextOptions.md)\&lt;`TDeps`\&gt; |

## Returns

[`ToolExecutionContext`](/api/@graphorin/core/interfaces/ToolExecutionContext.md)\&lt;`TDeps`\&gt;
