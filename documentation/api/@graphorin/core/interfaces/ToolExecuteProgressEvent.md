[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteProgressEvent

# Interface: ToolExecuteProgressEvent

Defined in: packages/core/src/types/agent-event.ts:163

**`Stable`**

Emitted by streaming-hint tools via `ctx.reportProgress(...)`. Counter
pair `(current, total?)` is consumer-rendered as a percentage when both
fields are present.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-current"></a> `current` | `readonly` | `number` | packages/core/src/types/agent-event.ts:167 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:169 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:170 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:166 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:165 |
| <a id="property-total"></a> `total?` | `readonly` | `number` | packages/core/src/types/agent-event.ts:168 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/core/src/types/agent-event.ts:171 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.progress"` | packages/core/src/types/agent-event.ts:164 |
