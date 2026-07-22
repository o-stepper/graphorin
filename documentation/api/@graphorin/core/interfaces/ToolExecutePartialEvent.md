[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecutePartialEvent

# Interface: ToolExecutePartialEvent

Defined in: packages/core/src/types/agent-event.ts:206

**`Stable`**

Emitted by streaming-hint tools via `ctx.streamContent(...)`. Each
chunk is concatenated into the assembled `output` per the
buffer-becomes-output discipline. `chunkIndex` is monotone per
`(toolCallId)` so subscribers can detect drops.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-chunk"></a> `chunk` | `readonly` | [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md) | packages/core/src/types/agent-event.ts:210 |
| <a id="property-chunkindex"></a> `chunkIndex` | `readonly` | `number` | packages/core/src/types/agent-event.ts:211 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:212 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:209 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:208 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/core/src/types/agent-event.ts:213 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.partial"` | packages/core/src/types/agent-event.ts:207 |
