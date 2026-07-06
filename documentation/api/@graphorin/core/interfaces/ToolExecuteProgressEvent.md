[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteProgressEvent

# Interface: ToolExecuteProgressEvent

Defined in: packages/core/src/types/agent-event.ts:147

Emitted by streaming-hint tools via `ctx.reportProgress(...)`. Counter
pair `(current, total?)` is consumer-rendered as a percentage when both
fields are present.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-current"></a> `current` | `readonly` | `number` | packages/core/src/types/agent-event.ts:151 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:153 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:154 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:150 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:149 |
| <a id="property-total"></a> `total?` | `readonly` | `number` | packages/core/src/types/agent-event.ts:152 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/core/src/types/agent-event.ts:155 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.progress"` | packages/core/src/types/agent-event.ts:148 |
