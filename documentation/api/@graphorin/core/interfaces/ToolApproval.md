[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolApproval

# Interface: ToolApproval

Defined in: packages/core/src/types/tool.ts:224

Pending approval bookkeeping: a tool that needed human confirmation
before execution. Stored on `RunState.pendingApprovals` until the
caller resumes the run with a granted/denied decision.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | packages/core/src/types/tool.ts:227 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/core/src/types/tool.ts:228 |
| <a id="property-requestedat"></a> `requestedAt` | `readonly` | `string` | packages/core/src/types/tool.ts:229 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/tool.ts:225 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/tool.ts:226 |
