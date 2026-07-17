[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireToolExecutePartialEvent

# Interface: WireToolExecutePartialEvent

Defined in: [packages/core/src/types/agent-event-wire.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L48)

Wire twin of [ToolExecutePartialEvent](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).

## Stable

## Extends

- `Omit`\&lt;[`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md), `"chunk"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-chunk"></a> `chunk` | `readonly` | [`WireContentChunk`](/api/@graphorin/core/type-aliases/WireContentChunk.md) | - | [packages/core/src/types/agent-event-wire.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L49) |
| <a id="property-chunkindex"></a> `chunkIndex` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`chunkIndex`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-chunkindex) | [packages/core/src/types/agent-event.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L187) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`stepNumber`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-stepnumber) | [packages/core/src/types/agent-event.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L188) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`toolCallId`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-toolcallid) | [packages/core/src/types/agent-event.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L185) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`toolName`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-toolname) | [packages/core/src/types/agent-event.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L184) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`ts`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-ts) | [packages/core/src/types/agent-event.ts:189](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L189) |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.partial"` | [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md).[`type`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md#property-type) | [packages/core/src/types/agent-event.ts:183](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L183) |
