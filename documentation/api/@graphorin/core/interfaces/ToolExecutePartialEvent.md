[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecutePartialEvent

# Interface: ToolExecutePartialEvent

Defined in: [packages/core/src/types/agent-event.ts:182](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L182)

Emitted by streaming-hint tools via `ctx.streamContent(...)`. Each
chunk is concatenated into the assembled `output` per the
buffer-becomes-output discipline. `chunkIndex` is monotone per
`(toolCallId)` so subscribers can detect drops.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-chunk"></a> `chunk` | `readonly` | [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md) | [packages/core/src/types/agent-event.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L186) |
| <a id="property-chunkindex"></a> `chunkIndex` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L187) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L188) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L185) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L184) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:189](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L189) |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.partial"` | [packages/core/src/types/agent-event.ts:183](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L183) |
