[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteProgressEvent

# Interface: ToolExecuteProgressEvent

Defined in: packages/core/src/types/agent-event.ts:123

Emitted by streaming-hint tools via `ctx.reportProgress(...)`. Counter
pair `(current, total?)` is consumer-rendered as a percentage when both
fields are present.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-current"></a> `current` | `readonly` | `number` | packages/core/src/types/agent-event.ts:127 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:129 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:130 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:126 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:125 |
| <a id="property-total"></a> `total?` | `readonly` | `number` | packages/core/src/types/agent-event.ts:128 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/core/src/types/agent-event.ts:131 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.progress"` | packages/core/src/types/agent-event.ts:124 |
