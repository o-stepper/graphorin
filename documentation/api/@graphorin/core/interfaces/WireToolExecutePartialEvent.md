[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireToolExecutePartialEvent

# Interface: WireToolExecutePartialEvent

Defined in: packages/core/src/types/agent-event-wire.ts:47

Wire twin of [ToolExecutePartialEvent](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).

## Stable

## Extends

- `Omit`\&lt;[`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md), `"chunk"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-chunk"></a> `chunk` | `readonly` | [`WireContentChunk`](/api/@graphorin/core/type-aliases/WireContentChunk.md) | - | packages/core/src/types/agent-event-wire.ts:48 |
| <a id="property-chunkindex"></a> `chunkIndex` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`chunkIndex`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-chunkindex) | packages/core/src/types/agent-event.ts:152 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`stepNumber`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-stepnumber) | packages/core/src/types/agent-event.ts:153 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`toolCallId`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-toolcallid) | packages/core/src/types/agent-event.ts:150 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`toolName`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-toolname) | packages/core/src/types/agent-event.ts:149 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`ts`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-ts) | packages/core/src/types/agent-event.ts:154 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.partial"` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`type`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-type) | packages/core/src/types/agent-event.ts:148 |
