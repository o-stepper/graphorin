[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolApproval

# Interface: ToolApproval

Defined in: packages/core/src/types/tool.ts:296

Pending approval bookkeeping: a tool that needed human confirmation
before execution. Stored on `RunState.pendingApprovals` until the
caller resumes the run with a granted/denied decision.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | packages/core/src/types/tool.ts:299 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/core/src/types/tool.ts:300 |
| <a id="property-requestedat"></a> `requestedAt` | `readonly` | `string` | packages/core/src/types/tool.ts:301 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/tool.ts:297 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/tool.ts:298 |
