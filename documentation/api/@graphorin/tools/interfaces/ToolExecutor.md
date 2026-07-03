[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolExecutor

# Interface: ToolExecutor

Defined in: packages/tools/src/executor/executor.ts:271

Public executor surface.

## Methods

### executeBatch()

```ts
executeBatch(opts): Promise<readonly CompletedToolCall<unknown>[]>;
```

Defined in: packages/tools/src/executor/executor.ts:273

Run a batch of tool calls.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ExecuteBatchOptions`](/api/@graphorin/tools/interfaces/ExecuteBatchOptions.md) |

#### Returns

`Promise`\<readonly [`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;[]\>

***

### executeOne()

```ts
executeOne(opts): Promise<CompletedToolCall<unknown>>;
```

Defined in: packages/tools/src/executor/executor.ts:275

Run a single tool call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `call`: [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md); `runContext`: [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md); `stepNumber`: `number`; `trustLevel?`: [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md); \} |
| `opts.call` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) |
| `opts.runContext` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) |
| `opts.stepNumber` | `number` |
| `opts.trustLevel?` | [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md) |

#### Returns

`Promise`\<[`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;\>
