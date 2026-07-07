[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeExecuteBridge

# Type Alias: CodeExecuteBridge

```ts
type CodeExecuteBridge = (call, ctx) => Promise<unknown>;
```

Defined in: [packages/tools/src/code-mode/meta-tools.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/meta-tools.ts#L139)

Host bridge: run one bridged tool call and return its output. Receives
the `code_execute` call's own [ToolExecutionContext](/api/@graphorin/core/interfaces/ToolExecutionContext.md), so the agent
can route the inner call through the real executor under the same
`runContext` (same run / step / tracer / secrets scope).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `call` | [`BridgedToolCall`](/api/@graphorin/security/interfaces/BridgedToolCall.md) |
| `ctx` | [`ToolExecutionContext`](/api/@graphorin/core/interfaces/ToolExecutionContext.md) |

## Returns

`Promise`\&lt;`unknown`\&gt;
