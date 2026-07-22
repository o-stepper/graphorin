[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolExecutor

# Interface: ToolExecutor

Defined in: packages/tools/src/executor/types.ts:430

Public executor surface.

## Methods

### executeBatch()

```ts
executeBatch(opts): Promise<readonly CompletedToolCall<unknown>[]>;
```

Defined in: packages/tools/src/executor/types.ts:432

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

Defined in: packages/tools/src/executor/types.ts:434

Run a single tool call.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `call`: [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md); `capability?`: `"read-only"`; `disableRepair?`: `boolean`; `preApproved?`: `boolean`; `runContext`: [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md); `stepNumber`: `number`; `trustLevel?`: [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md); \} | - |
| `opts.call` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) | - |
| `opts.capability?` | `"read-only"` | See [ExecuteBatchOptions.capability](/api/@graphorin/tools/interfaces/ExecuteBatchOptions.md#property-capability). |
| `opts.disableRepair?` | `boolean` | See [ExecuteBatchOptions.disableRepair](/api/@graphorin/tools/interfaces/ExecuteBatchOptions.md#property-disablerepair). |
| `opts.preApproved?` | `boolean` | See [ExecuteBatchOptions.preApproved](/api/@graphorin/tools/interfaces/ExecuteBatchOptions.md#property-preapproved). |
| `opts.runContext` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - |
| `opts.stepNumber` | `number` | - |
| `opts.trustLevel?` | [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md) | - |

#### Returns

`Promise`\<[`CompletedToolCall`](/api/@graphorin/core/interfaces/CompletedToolCall.md)\&lt;`unknown`\&gt;\>
