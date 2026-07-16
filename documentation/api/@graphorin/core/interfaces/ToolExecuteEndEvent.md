[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteEndEvent

# Interface: ToolExecuteEndEvent

Defined in: [packages/core/src/types/agent-event.ts:193](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L193)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | [packages/core/src/types/agent-event.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L199) |
| <a id="property-result"></a> `result` | `readonly` | `unknown` | - | [packages/core/src/types/agent-event.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L198) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/core/src/types/agent-event.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L195) |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | See [ToolExecuteStartEvent.toolName](/api/@graphorin/core/interfaces/ToolExecuteStartEvent.md#property-toolname) (W-049). | [packages/core/src/types/agent-event.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L197) |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.end"` | - | [packages/core/src/types/agent-event.ts:194](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L194) |
