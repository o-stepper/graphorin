[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteProgressEvent

# Interface: ToolExecuteProgressEvent

Defined in: [packages/core/src/types/agent-event.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L163)

Emitted by streaming-hint tools via `ctx.reportProgress(...)`. Counter
pair `(current, total?)` is consumer-rendered as a percentage when both
fields are present.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-current"></a> `current` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L167) |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L169) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L170) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L166) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L165) |
| <a id="property-total"></a> `total?` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L168) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L171) |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.progress"` | [packages/core/src/types/agent-event.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L164) |
