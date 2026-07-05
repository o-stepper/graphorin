[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecutePartialEvent

# Interface: ToolExecutePartialEvent

Defined in: packages/core/src/types/agent-event.ts:147

Emitted by streaming-hint tools via `ctx.streamContent(...)`. Each
chunk is concatenated into the assembled `output` per the
buffer-becomes-output discipline. `chunkIndex` is monotone per
`(toolCallId)` so subscribers can detect drops.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-chunk"></a> `chunk` | `readonly` | [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md) | packages/core/src/types/agent-event.ts:151 |
| <a id="property-chunkindex"></a> `chunkIndex` | `readonly` | `number` | packages/core/src/types/agent-event.ts:152 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:153 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:150 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:149 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/core/src/types/agent-event.ts:154 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.partial"` | packages/core/src/types/agent-event.ts:148 |
